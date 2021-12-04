import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;
    isVisible = false;
    step = false;
    direction = 1;

    constructor(eventAggregator, stateService, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this.position = this._stateService.getPusherPosition();
        this._winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription.dispose();
            this.isVisible = false;
        });
        this._giveUpSubscriber = this._eventAggregator.subscribe('giveUp', _ => {
            this._moveSubscription.dispose();
            this.isVisible = false;
        });
        this._gameStartSubscriber = this._eventAggregator.subscribe('gameStart', _ => {
            this.position = this._stateService.getPusherPosition();
            this._addMoveListener();
            // this.changeGender();
            this.isVisible = true;
        });
    }

    detached() {
        this._moveSubscription && this._moveSubscription.dispose();
        this._winSubscriber.dispose();
        this._giveUpSubscriber.dispose();
        this._gameStartSubscriber.dispose();
    }

    changeGender() {
        this.gender = (this.gender == 'male') ? 'female' : 'male';
    }

    _addMoveListener() {
        this._moveSubscription && this._moveSubscription.dispose();
        this._moveSubscription = this._eventAggregator.subscribe('keyPressed', key => {
            this._moveIfPossible(key);
        });
    }

    _doMove(newPosition) {
        this.step = (this.step == 'step') ? '' : 'step';
        this.position = newPosition;
        this._eventAggregator.publish('move');
    }

    _moveIfPossible(key) {
        this.lastKey = key;
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            if (this._stateService.throughExit(newPosition)) {
                this._doMove(newPosition);
                this._eventAggregator.publish('win');
            } else {
                if (this._stateService.isFree(newPosition)) {
                    this._doMove(newPosition);
                } else if (this._stateService.moveBrick(newPosition, vector)) {
                    this._doMove(newPosition);
                }
            }
        }
    }

}
