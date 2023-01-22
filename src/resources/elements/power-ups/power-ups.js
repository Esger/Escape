import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(EventAggregator, StateService, HelperService)

export class PowerUpsCustomElement {


    constructor(eventAggregator, stateService, helperService) {
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helperService = helperService;
    }

    attached() {
        this._boardSize = this._stateService.getBoardSize();
        this.blockSize = this._stateService.getBlockSize();
        this._initialize();
        this._gameStartSubscription = this._eventAggregator.subscribe('bricksReady', _ => this._addInitalPowerUps());
        this._winSubscription = this._eventAggregator.subscribe('win', _ => this._initialize());
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._initialize());
        this._caughtUpSubscription = this._eventAggregator.subscribe('caught', _ => this._initialize());
        this._consumeSubscription = this._eventAggregator.subscribe('consume', powerUp => this._consume(powerUp));
    }

    detached() {
        this._gameStartSubscription.dispose();
        this._winSubscription.dispose();
        this._giveUpSubscription.dispose();
        this._caughtUpSubscription.dispose();
        this._consumeSubscription.dispose();
    }

    _addInitalPowerUps() {
        for (let count = 0; count < 5; count++) {
            this._addPowerUp('gold');
        }
        setTimeout(_ => {
            this._showPowerUp();
        }, 1200);
    }

    _addPowerUp(type) {
        const powerUp = {
            type: type,
        }
        const maxAttempts = 50;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = [
                this._helperService.randomNumberWithin(this._boardSize),
                this._helperService.randomNumberWithin(this._boardSize)
            ];
            if (this._stateService.isFreeForPowerUp(position)) {
                powerUp.position = position;
                this.powerUps.push(powerUp);
                break;
            }
        }
    }

    _showPowerUp() {
        $('.powerUp--hidden').removeClass('powerUp--hidden');
        this._helperService.flashElements('.powerUp');
    }

    _consume(powerUp) {
        const theOneIndex = this.powerUps.findIndex(p => {
            return this._helperService.areEqual([p.position, powerUp.position]);
        });
        this.powerUps.splice(theOneIndex, 1);
        const allGoldConsumed = !this.powerUps?.find(powerUp => powerUp.type === 'gold');
        allGoldConsumed && this._eventAggregator.publish('allGoldConsumed');
    }

    _initialize() {
        this.powerUps = [];
        this._stateService.setPowerUps(this.powerUps);
    }

}
