import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(Element, EventAggregator, StateService, HelperService)
export class Exits {

    constructor(element, eventAggregator, stateService, helperService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helpers = helperService;
        this._isTouchDevice = sessionStorage.getItem('isMobile') == 'true';
        this._boardSize = this._stateService.getBoardSize();
        this._blockSize = this._stateService.getBlockSize();
        this.exits = this._stateService.getExits();
    }

    attached() {
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._element.style.setProperty('--exitColor', 'lime');
            this.exits = this._stateService.getExits();
            this._eventAggregator.publish('exitsReady');
        });
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribe('caught', _ => this._gameEnd());
        this._setArrow();
    }

    detached() {
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
        this._gameStartSubscription.dispose();
    }

    _gameEnd() {
        this._element.style.setProperty('--exitColor', 'red');
        this._exitOffset = 10;
    }

    _setArrow() {
        const exitSize = parseInt(window.getComputedStyle(this._element).getPropertyValue('--exitSize'), 10);
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
        const size = Math.round((exitSize * vmin) / 24);
        const x = 3, y = 3, a = 9, b = 3;
        const path = `m${x * size} ${y * size} h${a * size} l${-b * size} ${b * size} l${a * size} ${a * size} l${-b * size} ${b * size} l${-a * size} ${-a * size} l${-b * size} ${b * size} v${-a * size}`

        this._element.style.setProperty('--arrowPath', '"' + path + '"');
    }
}
