import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;
    isVisible = false;

    constructor(eventAggregator, stateService, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this.position = this._stateService.getPusherPosition();
    }

    attached() {
        this._winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription.dispose();
            this.isVisible = false;
        });
        this._gameStartSubscriber = this._eventAggregator.subscribe('gameStart', _ => {
            this.position = this._stateService.getPusherPosition();
            this._addMoveListener();
            this.isVisible = true;
        })
    }

    detached() {
        this._moveSubscription.dispose();
        this._winSubscriber.dispose();
        this._gameStartSubscriber.dispose();
    }

    _doMove(newPosition) {
        this.position = newPosition;
        this._eventAggregator.publish('move', -1);
    }

    _moveIfPossible(key) {
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            if (this._stateService.throughExit(newPosition)) {
                this._doMove(newPosition);
                this._stateService.win();
            } else {
                if (this._stateService.isFree(newPosition)) {
                    this._doMove(newPosition);
                } else if (this._stateService.moveBrick(newPosition, vector)) {
                    this._doMove(newPosition);
                }
            }
        }
    }

    _addMoveListener() {
        this._moveSubscription = this._eventAggregator.subscribe('keyPressed', key => {
            this._moveIfPossible(key);
        });
    }

}
