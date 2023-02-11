import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';
import { AbstractPusher } from './abstract-pusher';

@inject(EventAggregator, Element, StateService, HelperService)
export class FaassenCustomElement extends AbstractPusher {
    @bindable pusher;

    positionStyle = '';

    constructor(eventAggregator, element, stateService, helperService) {
        super(eventAggregator, element, stateService, helperService);
    }

    attached() {
        this._setPositionStyle();
        this._keyMoveSubscription = this._eventAggregator.subscribe('moveKeyPressed', key => this._dispatchMove(key));
        this._swipeMoveSubscription = this._eventAggregator.subscribe('direction', direction => this._dispatchMove(direction));
        this._dieSubscription = this._eventAggregator.subscribe('die', index => this._fallDown(index));
    }

    detached() {
        this._keyMoveSubscription.dispose();
        this._swipeMoveSubscription.dispose();
        this._dieSubscription.dispose();
    }

    _dispatchMove(key) {
        let direction = this.directions.indexOf(key);
        const directionToPlayer = this._stateService.directionToPlayer(this.pusher);
        if (directionToPlayer !== undefined)
            direction = directionToPlayer;
        else { // direction = +1 or -1 randomly selected direction
            const delta = this._helperService.randomNumberWithin(3) - 1;
            direction = (direction + delta + 3) % 3;
        }
        this.lastKey = this.directions[direction];
        direction > -1 && this._moveIfPossible(direction);
    }

    _doMove(newPosition) {
        this.pusher.previousPosition = this.pusher.position;
        this.pusher.position = newPosition;
        this._setPositionStyle();
        this._eventAggregator.publish('move', this.pusher);
    }

    _fallDown(index) {
        if (index !== this.pusher.index) return;
        this._element.classList.add('pusher--fallDown');
    }

    _moveIfPossible(direction) {
        const vector = this._helperService.direction2vector(direction);
        const newPosition = this._helperService.sumVectors(this.pusher.position, vector);

        const fieldContent = this._stateService.isFree(newPosition);
        if (fieldContent === true) {
            this._doMove(newPosition);
            return;
        }

        const isObject = typeof fieldContent === 'object';
        if (isObject) {
            this._doMove(newPosition);
            return;
        }

        if (this._stateService.moveBrick(newPosition, vector, false)) {
            this._doMove(newPosition);
            return;
        }
        this.pusher.direction = undefined;
    }
}
