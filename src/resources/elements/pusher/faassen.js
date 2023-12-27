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
        this._keyMoveSubscription = this._eventAggregator.subscribe('moveKeyPressed',
            _ => this._dispatchMove());
        this._swipeMoveSubscription = this._eventAggregator.subscribe('direction',
            _ => this._dispatchMove());
        this._dieSubscription = this._eventAggregator.subscribe('die',
            index => this._fallDown(index));
    }

    detached() {
        this._keyMoveSubscription.dispose();
        this._swipeMoveSubscription.dispose();
        this._dieSubscription.dispose();
    }

    _fallDown(index) {
        if (index !== this.pusher.index) return;
        this._element.classList.add('pusher--fallDown');
    }

    _turnLeft() {
        this.pusher.direction = (this.pusher.direction + 3) % 4;
        this.lastKey = this.directions[this.pusher.direction];
    }

    _turnRight() {
        this.pusher.direction = (this.pusher.direction + 1) % 4;
        this.lastKey = this.directions[this.pusher.direction];
    }

    _dispatchMove(direction = undefined) {
        let stepVector;
        if (direction === undefined) {
            const vectorToPlayer = this._stateService.vectorToPlayer(this.pusher);
            stepVector = this._helperService.clampVector(vectorToPlayer);
            this.pusher.direction = this._helperService.vector2direction(stepVector);
        } else stepVector = this._helperService.direction2vector(this.pusher.direction);
        const newPosition = this._helperService.sumVectors(this.pusher.position, stepVector);
        const cellAhead = this._stateService.isFree(newPosition);
        switch (true) {
            case !cellAhead:
                break;
            case typeof cellAhead === 'object':
                this._doMove(newPosition)
                break;
            case cellAhead === true:
                this._doMove(newPosition)
                break;
            case cellAhead?.includes('brokenbrick'):
                this._turnLeft();
                if (!this._tryMove(stepVector)) {
                    this._dispatchMove(this.pusher.direction);
                }
                break;
            case cellAhead?.includes('brick'):
                if (!this._tryMove(stepVector)) {
                    if (direction === undefined) {
                        this._turnRight();
                        this._dispatchMove(this.pusher.direction);
                    }
                }
                break;
            default:
                this._tryMove(direction);
        }
        this.lastKey = this.directions[this.pusher.direction];
    }

    _tryMove(stepVector) {
        let newPosition = this._helperService.sumVectors(this.pusher.position, stepVector);
        let fieldContent = this._stateService.isFree(newPosition);
        if (fieldContent === true ||
            typeof fieldContent === 'object' ||
            this._stateService.moveBrick(newPosition, stepVector)) {
            this._doMove(newPosition);
            return true;
        }
        return false;
    }

}
