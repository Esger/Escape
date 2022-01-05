import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, Element, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;
    @bindable position;
    @bindable direction;
    @bindable playerType;

    isVisible = false;
    step = false;
    bolts = 0;

    constructor(eventAggregator, element, stateService, directionToVectorValueConverter) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this.lastKey = 'down';
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._moveSubscription?.dispose();
            this.isVisible = false;
            this.lastKey = 'down';
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this.isVisible = true;
        });
        this._boltsCountSubscription = this._eventAggregator.subscribe('boltsCount', bolts => {
            this.bolts = bolts;
        });
    }

    attached() {
        this.isFaassen = this.playerType == 'faassen';
        this.bolts = this._stateService.getBolts();
        this._element.classList.add(this.playerType);
        setTimeout(() => {
            this._element.classList.add('flash--in');
            setTimeout(() => {
                this._element.classList.remove('flash--in');
            }, 250);
        });
        this._addMoveListener();
        this._moveSubscription = this._eventAggregator.subscribe('move', message => {
            if (message.type !== this.playerType) {
                const samePosition = this._stateService.areEqual([message.position, this.position]);
                if (samePosition) {
                    setTimeout(() => this._eventAggregator.publish('giveUp', 'caught'), 250);
                    console.log(message.position, this.position);
                }
            }
        });
    }

    detached() {
        this._moveSubscription && this._moveSubscription.dispose();
        this._winSubscription.dispose();
        this._retrySubscription.dispose();
        this._giveUpSubscription.dispose();
        this._gameStartSubscription.dispose();
        this._boltsCountSubscription.dispose();
        this._moveSubscription.dispose();
    }

    changeGender() {
        this.gender = (this.gender == 'male') ? 'female' : 'male';
    }

    _addMoveListener() {
        this._moveSubscription && this._moveSubscription.dispose();
        this._moveSubscription = this._eventAggregator.subscribe('keyPressed', key => {
            if (this.isFaassen) {
                let canMove = this._moveIfPossible(this.direction || key);
                while (canMove) {
                    canMove = this._moveIfPossible(key);
                }
                this.direction = undefined;
            } else {
                this._moveIfPossible(key);
            }
        });
    }

    _doMove(newPosition) {
        this.position = newPosition;
        this.step = (this.step == 'step') ? '' : 'step';
        const message = {
            'type': this.playerType,
            'position': this.position
        }
        this._eventAggregator.publish('move', message);
    }

    _addTransitionendListenter() {
        this._element.addEventListener('transitionend', e => {
            this._outsideResolve(e);
        }, { 'once': true });
    }

    _moveIfPossible(key) {
        this.lastKey = key;
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        this._addTransitionendListenter();
        let afterMove = new Promise((resolve, reject) => {
            this._outsideResolve = resolve;
        });
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            const exited = this._stateService.throughExit(newPosition);
            if (!this.isFaassen && exited) {
                console.log('exited: ', newPosition);
                this._doMove(newPosition);
                setTimeout(() => {
                    this._eventAggregator.publish('win');
                }, 200);
                return true;
            } else {
                if (this._stateService.isFree(newPosition)) {
                    this._doMove(newPosition);
                    afterMove.then(() => {
                        this.isFaassen && this._moveIfPossible(key);
                    });
                } else {
                    const canThrowBolts = !this.isFaassen && this.bolts > 0;
                    if (this._stateService.moveBrick(newPosition, vector, canThrowBolts)) {
                        this._doMove(newPosition);
                        afterMove.then(() => {
                            this.isFaassen && this._moveIfPossible(key);
                        });
                    }
                }
            }
        }
    }

}
