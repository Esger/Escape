import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, StateService, HelperService)

export class PowerUpsCustomElement {

    constructor(eventAggregator, stateService, helperService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helpers = helperService;
    }

    attached() {
        this._boardSize = this._stateService.getBoardSize();
        this.blockSize = this._stateService.getBlockSize();
        this._initialize();
        this._gameStartSubscription = this._eventAggregator.subscribe('bricksReady', _ => {
            this._addPowerUp('gold');
        });
        this._winSubscription = this._eventAggregator.subscribe('win', _ => {
            this._initialize();
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._initialize();
        });
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
    }

    _addPowerUp(type) {
        const powerUp = {
            type: type,
        }
        const maxAttempts = 50;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = [
                this._helpers.randomNumberWithin(this._boardSize),
                this._helpers.randomNumberWithin(this._boardSize)
            ];
            if (this._stateService.isFree(position)) {
                powerUp.position = position;
                this.powerUps.push(powerUp);
                break;
            }
        }
    }

    _initialize() {
        this.powerUps = [];
    }

}
