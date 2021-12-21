import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, Element, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;
    isVisible = false;
    step = false;
    direction = 1;
    bolts = 0;
    track = [];

    constructor(eventAggregator, element, stateService, directionToVectorValueConverter) {
        this._enter = 0;
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this.position = this._stateService.getPusherPosition();
        this._winSubscriber = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this.position = this._stateService.getPusherPosition();
            this.track = [];
            this.lastKey = 'down';
        });
        this._giveUpSubscriber = this._eventAggregator.subscribe('giveUp', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._gameStartSubscriber = this._eventAggregator.subscribe('gameStart', _ => {
            this.position = this._stateService.getPusherPosition();
            this.track = [];
            this.isVisible = true;
            this.direction = 1;
            setTimeout(() => {
                this._element.classList.add('flash', 'flash--in');
                setTimeout(() => {
                    this._element.classList.remove('flash', 'flash--in');
                }, 250);
            });
            this._addMoveListener();
            // this.changeGender();
        });
        this._boltsCountSubscriber = this._eventAggregator.subscribe('boltsCount', bolts => this.bolts = bolts);
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
        this._eventAggregator.publish('move');
    }

    _doMove(newPosition) {
        this.track.push([...this.position]);
        this.position = newPosition;
        this._step();
    }

    _backup(faassenIndex) {
        const currentPosition = [...this.position];
        this.position = this.track.length ? this.track.pop() : this.position;
        this._eventAggregator.publish('followMe', { position: currentPosition, index: faassenIndex });
        this._step();
    }

    _moveIfPossible(key) {
        this.lastKey = key;
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            if (this._stateService.throughExit(newPosition)) {
                this._doMove(newPosition);
                setTimeout(() => {
                    this._eventAggregator.publish('win');
                }, 200);
            } else {
                const blockingFaassen = this._stateService.faassenIsBlocking(newPosition);
                if (blockingFaassen > -1) {
                    this._backup(blockingFaassen);
                } else if (this._stateService.isFree(newPosition)) {
                    this._doMove(newPosition);
                } else if (this._stateService.moveBrick(newPosition, vector, (this.bolts > 0))) {
                    this._doMove(newPosition);
                }
            }
        }
    }

}
