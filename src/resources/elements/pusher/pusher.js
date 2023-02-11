import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';
import { AbstractPusher } from './abstract-pusher';

@inject(EventAggregator, Element, StateService, HelperService)
export class PusherCustomElement extends AbstractPusher {
    @bindable pusher;

    step = '';
    gender = '';
    positionStyle = '';

    constructor(eventAggregator, element, stateService, helperService) {
        super(eventAggregator, element, stateService, helperService);
    }

    attached() {
        this.gender = 'female';
        this._setPositionStyle(0);
        this._keyMoveSubscription = this._eventAggregator.subscribe('moveKeyPressed', key => this._dispatchMove(key));
        this._swipeMoveSubscription = this._eventAggregator.subscribe('direction', direction => this._dispatchMove(direction));
    }

    detached() {
        this._keyMoveSubscription.dispose();
        this._swipeMoveSubscription.dispose();
    }

    changeGender() {
        if (!this._isFaassen) {
            this.gender = (this.gender == 'male') ? 'female' : 'male';
        }
    }

    _dispatchMove(key) {
        let direction = this.directions.indexOf(key);
        this.lastKey = key;
        direction > -1 && this._moveIfPossible(direction);
    }

    _doMove(newPosition) {
        this.pusher.previousPosition = this.pusher.position;
        this.pusher.position = newPosition;
        this._setPositionStyle(0);
        this._eventAggregator.publish('move', this.pusher);
    }

    _moveIfPossible(direction) {
        const vector = this._helperService.direction2vector(direction);
        const newPosition = this._helperService.sumVectors(this.pusher.position, vector);

        const exited = this._stateService.throughExit(newPosition);
        if (exited) {
            this._doMove(newPosition);
            setTimeout(_ => this._eventAggregator.publish('win'), 200);
            return;
        }

        let canThrowBolts = this._stateService.getBolts() > 0;
        setTimeout(_ => {
            const faassen = this._stateService.isOnFaassen(); // areEqual gebruiken???
            if (faassen) {
                if (canThrowBolts) {
                    this._eventAggregator.publish('die', faassen.index);
                    setTimeout(_ => {
                        this._eventAggregator.publish('kill', faassen.index)
                    }, 500);
                } else {
                    setTimeout(_ => this._eventAggregator.publish('caught'), 250);
                }
            }
        });

        const fieldContent = this._stateService.isFree(newPosition);
        if (fieldContent === true) {
            this._doMove(newPosition);
            return;
        }

        const isObject = typeof fieldContent === 'object';
        if (isObject) {
            this._eventAggregator.publish('consume', fieldContent);
            this._doMove(newPosition);
            return;
        }

        if (this._stateService.moveBrick(newPosition, vector, canThrowBolts)) {
            this._doMove(newPosition);
            return;
        }
        this.pusher.direction = undefined;
    }
}
