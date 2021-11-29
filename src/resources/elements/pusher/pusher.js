import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(EventAggregator, StateService)
export class PusherCustomElement {
    @bindable blockSize;

    constructor(eventAggregator, stateService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this.position = this._stateService.getPusherPosition();
    }

    attached() {
        this._addMoveListener();
    }

    detached() {
        this._moveSubscription.dispose();
    }

    _moveIfPossible(key) {
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        let vector = [];
        switch (key) {
            case 'right': vector = directions[0];
                break;
            case 'down': vector = directions[1]
                break;
            case 'left': vector = directions[2];
                break;
            case 'up': vector = directions[3];
                break;
        }
        const newPosition = {
            left: this.position.left + vector[0],
            top: this.position.top + vector[1]
        }
        if (this._stateService.withinBounds(newPosition)) {
            if (this._stateService.isFree(newPosition)) {
                this.position = newPosition;
            } else if (this._stateService.moveBlock(newPosition, vector)) {
                this.position = newPosition;
            }
        }
    }

    _addMoveListener() {
        this._moveSubscription = this._eventAggregator.subscribe('keyPressed', key => {
            this._moveIfPossible(key);
        });
    }

    valueChanged(newValue, oldValue) {
        //
    }
}
