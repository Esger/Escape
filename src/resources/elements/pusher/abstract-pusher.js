import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

export class AbstractPusher {

    constructor(eventAggregator, element, stateService, helperService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helperService = helperService;
        this.directions = ['right', 'down', 'left', 'up'];
    }

    _setPositionStyle(offset = -.3) {
        const blockSize = this._stateService.getBlockSize();
        const left = blockSize * this.pusher.position[0] + offset;
        const top = blockSize * this.pusher.position[1] + offset;
        requestAnimationFrame(_ => {
            this.lastKey = this.pusher.direction !== undefined ? this.directions[this.pusher.direction] : this.lastKey;
            this.positionStyle = 'left:' + left + 'vmin; top:' + top + 'vmin;';
        });
    }
}
