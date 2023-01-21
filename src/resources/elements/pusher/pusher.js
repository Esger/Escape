import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, Element, StateService, HelperService)
export class PusherCustomElement {
    @bindable pusher;
    @bindable exits;

    step = '';
    gender = '';
    bolts = 0;
    positionStyle = '';

    constructor(eventAggregator, element, stateService, helperService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helperService = helperService;
        this.directions = ['right', 'down', 'left', 'up'];
    }

    attached() {
        this._isFaassen = this.pusher.type == 'faassen';
        !this._isFaassen && (this.gender = 'female');
        this._element.classList.add(this.pusher.type);
        this._setPositionStyle();
        this._helperService.flashElements('.player');
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._addGameEndSubscription();
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => this._gameEnd());
        this._keyMoveSubscription = this._eventAggregator.subscribe('moveKeyPressed', key => this._dispatchMove(key));
        this._swipeMoveSubscription = this._eventAggregator.subscribe('direction', direction => this._dispatchMove(direction));
        this._moveOtherPusherSubscription = this._eventAggregator.subscribe('move', otherPusher => {
            if (otherPusher.type !== this.pusher.type) {
                const samePosition = this._helperService.areEqual([otherPusher.position, this.pusher.position]);
                if (samePosition) {
                    setTimeout(_ => this._eventAggregator.publish('caught'), 250);
                }
            }
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._keyMoveSubscription.dispose();
        this._swipeMoveSubscription.dispose();
        this._moveOtherPusherSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
    }

    _addGameEndSubscription() {
    }

    _gameEnd() {
        this.lastKey = 'down';
    }

    _setPositionStyle() {
        const blockSize = this._stateService.getBlockSize();
        const offset = this._isFaassen ? -0.3 : 0;
        const left = blockSize * this.pusher.position[0] + offset;
        const top = blockSize * this.pusher.position[1] + offset;
        requestAnimationFrame(_ => {
            if (this._isFaassen) {
                this.lastKey = this.pusher.direction !== undefined ? this.directions[this.pusher.direction] : this.lastKey;
            } else {
                this.step = (!this._isFaassen && this.step == '') ? 'step' : '';
            }
            this.positionStyle = 'left:' + left + 'vmin; top:' + top + 'vmin;';
        });
    }

    changeGender() {
        if (!this._isFaassen) {
            this.gender = (this.gender == 'male') ? 'female' : 'male';
        }
    }

    _dispatchMove(key) {
        let direction;
        if (this._isFaassen && this.pusher.direction !== undefined) {
            direction = this.pusher.direction;
            this.lastKey = this.directions[direction];
        } else {
            direction = this.directions.indexOf(key);
            this.lastKey = key;
        }
        direction > -1 && this._moveIfPossible(direction);
    }

    _throughExit(position) {
        const exited = this.exits?.some((exit) => {
            if (exit) {
                return exit.some((e) => e[0] == position[0] && e[1] == position[1])
            }
        });
        return exited;
    }

    _doMove(newPosition) {
        this.pusher.position = newPosition;
        this._setPositionStyle();
        this._eventAggregator.publish('move', this.pusher);
    }

    _addTransitionendListenter() {
        this._element.addEventListener('transitionend.move', this._outsideResolve, { 'once': true });
    }

    _moveIfPossible(direction) {
        this._addTransitionendListenter();
        const afterMove = new Promise((resolve, reject) => {
            this._outsideResolve = resolve;
        });
        const moveFaassen = _ => {
            afterMove.then(_ => {
                this._isFaassen && this._moveIfPossible(this.pusher.direction || direction);
            });
        }
        const vector = this._helperService.direction2vector(direction);
        const newPosition = this._helperService.sumVectors(this.pusher.position, vector);

        const exited = !this._isFaassen && this._throughExit(newPosition);
        if (exited) {
            this._doMove(newPosition);
            setTimeout(_ => this._eventAggregator.publish('win'), 200);
            return;
        }

        const fieldContent = this._stateService.isFree(newPosition);
        if (fieldContent === true) {
            this._doMove(newPosition);
            moveFaassen();
            return;
        }

        const isObject = typeof fieldContent === 'object';
        if (isObject) {
            if (!this._isFaassen) {
                this._eventAggregator.publish('consume', fieldContent);
            }
            this._doMove(newPosition);
            moveFaassen();
            return;
        }

        const canThrowBolts = !this._isFaassen && this._stateService.getBolts() > 0;
        if (this._stateService.moveBrick(newPosition, vector, canThrowBolts)) {
            this._doMove(newPosition);
            moveFaassen();
            return;
        }
        this.pusher.direction = undefined;
    }
}
