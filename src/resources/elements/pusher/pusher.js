import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, StateService, DirectionToVectorValueConverter)
export class PusherCustomElement {
    @bindable blockSize;

    constructor(eventAggregator, stateService, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._directionToVector = directionToVectorValueConverter;
        this.position = this._stateService.getPusherPosition();
    }

    attached() {
        this._addMoveListener();
    }

    detached() {
        this._moveSubscription.dispose();
    }

    _moveIfPossible(key) {
        const direction = ['right', 'down', 'left', 'up'].indexOf(key);
        if (direction > -1) {
            const vector = this._directionToVector.toView(direction);
            const newPosition = this._stateService.sumVectors(this.position, vector);
            if (this._stateService.isFree(newPosition)) {
                this.position = newPosition;
            } else if (this._stateService.moveBrick(newPosition, vector)) {
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
