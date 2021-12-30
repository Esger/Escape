import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(Element, EventAggregator, StateService)
export class Exits {

    constructor(element, eventAggregator, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this.color = 'lime';
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._element.style.setProperty('--exitColor', 'red');
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._element.style.setProperty('--exitColor', 'lime');
            this.offsets = this._stateService.getExitOffsets();
        })
        this.offsets = this._stateService.getExitOffsets();
    }

    detached() {
        this._giveUpSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    move(direction) {
        this._eventAggregator.publish('keyPressed', direction);
    }
}
