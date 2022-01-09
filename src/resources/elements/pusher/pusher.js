import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, Element, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable pusher;

    step = false;
    bolts = 0;
    positionStyle = '';

    constructor(eventAggregator, element, stateService, directionToVectorValueConverter) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
    }

    attached() {
        this._isFaassen = this.pusher.type == 'faassen';
        this.bolts = this._stateService.getBolts();
        this._element.classList.add(this.pusher.type);
        this._setPositionStyle();
        setTimeout(_ => {
            this._element.classList.add('flash--in');
            setTimeout(_ => {
                this._element.classList.remove('flash--in');
            }, 250);
        });
        this._exitsReadySubscription = this._eventAggregator.subscribe('exitsReady', exits => {
            this._exits = exits;
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._moveSubscription?.dispose();
            this.lastKey = 'down';
        });
        this._retrySubscription = this._eventAggregator.subscribe('retry', _ => {
            setTimeout(() => {
                this._setPositionStyle();
            });
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
            if (this._isFaassen && this.pusher.direction) {
                direction = this.pusher.direction;
                this.lastKey = directions[direction];
            } else {
                direction = directions.indexOf(key);
                this.lastKey = key;
            }
            direction > -1 && this._moveIfPossible(direction);
        });
        this._moveOtherPusherSubscription = this._eventAggregator.subscribe('move', message => {
            if (message.type !== this.pusher.type) {
                const samePosition = this._stateService.areEqual([message.position, this.pusher.position]);
                if (samePosition) {
                    setTimeout(_ => this._eventAggregator.publish('giveUp', 'caught'), 250);
                    console.log(message.position, this.pusher.position);
                }
            }
        });
    }

    detached() {
        this._exitsReadySubscription.dispose();
        this._moveSubscription.dispose();
        this._moveOtherPusherSubscription.dispose();
        this._winSubscription.dispose();
        this._retrySubscription.dispose();
        this._giveUpSubscription.dispose();
        this._boltsCountSubscription.dispose();
    }

    _setPositionStyle() {
        const blockSize = this._stateService.getBlockSize();
        const offset = this._isFaassen ? -0.3 : 0;
        const left = blockSize * this.pusher.position[0] + offset;
        const top = blockSize * this.pusher.position[1] + offset;
        requestAnimationFrame(_ => this.positionStyle = 'left:' + left + 'vmin; top:' + top + 'vmin;');
        console.log(this.positionStyle);
    }

    changeGender() {
        this.gender = (this.gender == 'male') ? 'female' : 'male';
    }

    _throughExit(position) {
        const exited = this._exits?.some((exit) => exit.some((e) => e[0] == position[0] && e[1] == position[1]));
        return exited;
    }

    _doMove(newPosition) {
        this.pusher.position = newPosition;
        this.step = (this.step == 'step') ? '' : 'step';
        const message = {
            'index': this.pusher.index,
            'type': this.pusher.type,
            'position': this.pusher.position
        }
        this._setPositionStyle();
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
        const newPosition = this._stateService.sumVectors(this.pusher.position, vector);
        const exited = !this._isFaassen && this._throughExit(newPosition);
        if (exited) {
            console.log('exited: ', newPosition);
            this._doMove(newPosition);
            setTimeout(_ => {
                this._eventAggregator.publish('win');
            }, 200);
        } else {
            if (this._stateService.isFree(newPosition)) {
                this._doMove(newPosition);
                afterMove.then(_ => {
                    this._isFaassen && this._moveIfPossible(this.pusher.direction || direction);
                });
            } else {
                const canThrowBolts = !this._isFaassen && this.bolts > 0;
                if (this._stateService.moveBrick(newPosition, vector, canThrowBolts)) {
                    this._doMove(newPosition);
                    afterMove.then(_ => {
                        this._isFaassen && this._moveIfPossible(this.pusher.direction || direction);
                    });
                } else {
                    this.pusher.direction = undefined;
                }
            }
        }
    }

}
