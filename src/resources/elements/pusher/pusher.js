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

    step = false;
    bolts = 0;

    constructor(eventAggregator, element, stateService, directionToVectorValueConverter) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
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
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription?.dispose();
            this.lastKey = 'down';
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            this.lastKey = 'down';
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._moveSubscription?.dispose();
            this.lastKey = 'down';
        });
        this._boltsCountSubscription = this._eventAggregator.subscribe('boltsCount', bolts => {
            this.bolts = bolts;
        });
        this._moveSubscription = this._eventAggregator.subscribe('keyPressed', key => {
            const directions = ['right', 'down', 'left', 'up'];
            let direction;
            if (this.isFaassen && this.direction) {
                direction = this.direction;
                this.lastKey = directions[direction];
            } else {
                direction = directions.indexOf(key);
                this.lastKey = key;
            }
            direction > -1 && this._moveIfPossible(direction);
        });
        this._moveOtherPusherSubscription = this._eventAggregator.subscribe('move', message => {
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
        this._moveSubscription.dispose();
        this._moveOtherPusherSubscription.dispose();
        this._winSubscription.dispose();
        this._retrySubscription.dispose();
        this._giveUpSubscription.dispose();
        this._boltsCountSubscription.dispose();
    }

    changeGender() {
        this.gender = (this.gender == 'male') ? 'female' : 'male';
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

    _moveIfPossible(direction) {
        this._addTransitionendListenter();
        let afterMove = new Promise((resolve, reject) => {
            this._outsideResolve = resolve;
        });
        const vector = this._directionToVector.toView(direction);
        const newPosition = this._stateService.sumVectors(this.position, vector);
        const exited = !this.isFaassen && this._stateService.throughExit(newPosition);
        if (exited) {
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
                    this.isFaassen && this._moveIfPossible(this.direction || direction);
                });
            } else {
                const canThrowBolts = !this.isFaassen && this.bolts > 0;
                if (this._stateService.moveBrick(newPosition, vector, canThrowBolts)) {
                    this._doMove(newPosition);
                    afterMove.then(() => {
                        this.isFaassen && this._moveIfPossible(this.direction || direction);
                    });
                } else {
                    this.direction = undefined;
                }
            }
        }
    }

}
