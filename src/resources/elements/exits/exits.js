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
            this.offsets = this._stateService.getExitPositions();
        })
        this.offsets = this._stateService.getExitPositions();
        this.directions = ['up', 'right', 'down', 'left'];
        this.exits = this.offsets.map((position, index) => {
            const positionToUse = index % 2 === 0 ? 0 : 1;
            const negative = index > 1;
            const offset = negative ? 80 - position[positionToUse] : position[positionToUse];
            return {
                'direction': this.directions[index],
                'offset': position,
                'angle': (index * Math.PI / 2) + Math.PI / 2 * offset / 80
            }
        });
    }

    detached() {
        this._giveUpSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    move(direction) {
        this._eventAggregator.publish('keyPressed', direction);
    }
}
