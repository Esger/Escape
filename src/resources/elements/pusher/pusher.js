import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, Element, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;
    @bindable position;
    @bindable playerType;

    isVisible = false;
    step = false;
    bolts = 0;

    constructor(eventAggregator, element, stateService, directionToVectorValueConverter) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this._winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this.position = this.player.position;
            this.lastKey = 'down';
        });
        this._giveUpSubscriber = this._eventAggregator.subscribe('giveUp', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._gameStartSubscriber = this._eventAggregator.subscribe('gameStart', _ => {
        });
        this._boltsCountSubscriber = this._eventAggregator.subscribe('boltsCount', bolts => this.bolts = bolts);
    }

    attached() {
        this.isVisible = true;
        this.isFaassen = this.playerType == 'faassen';
        this._element.classList.add(this.playerType);
        setTimeout(() => {
            this._element.classList.add('flash--in');
            setTimeout(() => {
                this._element.classList.remove('flash--in');
            }, 250);
        });
        this._addMoveListener();
    }

    detached() {
        this._moveSubscription && this._moveSubscription.dispose();
        this._winSubscriber.dispose();
        this._retrySubscription.dispose();
        this._giveUpSubscriber.dispose();
        this._gameStartSubscriber.dispose();
        this._boltsCountSubscriber.dispose();
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

    _step() {
        this.step = (this.step == 'step') ? '' : 'step';
        this.isFaassen || this._eventAggregator.publish('move');
    }

    _doMove(newPosition) {
        this.position = newPosition;
        this._step();
    }

    _moveIfPossible(key) {
        this.lastKey = key;
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            if (!this.isFaassen && this._stateService.throughExit(newPosition)) {
                this._doMove(newPosition);
                setTimeout(() => {
                    this._eventAggregator.publish('win');
                }, 200);
            } else {
                if (this._stateService.isFree(newPosition)) {
                    this._doMove(newPosition);
                } else if (this._stateService.moveBrick(newPosition, vector, (this.bolts > 0))) {
                    this._doMove(newPosition);
                }
            }
        }
    }

}
