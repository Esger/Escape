import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(Element, EventAggregator, StateService)
export class Exits {

    constructor(element, eventAggregator, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._isTouchDevice = sessionStorage.getItem('isMobile') == 'true';
        this._level = this._stateService.getLevel();
        this._boardSize = this._stateService.getBoardSize();
        this._blockSize = this._stateService.getBlockSize();
    }

    attached() {
        this._setExits();
        this._giveUpSubscription = this._eventAggregator.subscribe('giveUp', _ => {
            this._element.style.setProperty('--exitColor', 'red');
        });
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._element.style.setProperty('--exitColor', 'lime');
            this.positions = [];
            setTimeout(() => {
                this._setExits();
            });
        });
    }

    detached() {
        this._giveUpSubscription.dispose();
        this._gameStartSubscription.dispose();
    }

    _setExits() {
        const max = this._boardSize;
        const offset = 1 + ((this._level + 9) % 18); // 1..19
        this._beforeExits = [
            [[offset, 0], [offset - 1, 0]],
            [[max - 1, offset], [max - 1, offset - 1]],
            [[max - offset, max - 1], [max - offset - 1, max - 1]],
            [[0, max - offset], [0, max - offset - 1]]
        ];

        let outwardsVectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        this._exits = this._beforeExits.map((beforeExit, index) => beforeExit.map(vector => {
            const newVector = this._stateService.sumVectors(vector, outwardsVectors[index]);
            return newVector;
        }));
        this._stateService.setExits(this._exits, this._beforeExits);

        outwardsVectors = [[0, 0], [1, 0], [0, 1], [0, 0]];
        const exitPositions = this._exits.map((exit, index) => exit.map(vector => {
            const newVector = this._stateService.sumVectors(vector, outwardsVectors[index]);
            return newVector;
        }));
        const positions = exitPositions.map(exit => this._stateService._multiplyVector(exit[0], this._blockSize));

        this.exits = positions.map((position, index) => {
            const positionToUse = index % 2 === 0 ? 0 : 1;
            const negative = index > 1;
            const boardSize = this._isTouchDevice ? 100 : 80;
            const offset = negative ? boardSize - position[positionToUse] : position[positionToUse];
            return {
                'position': position,
                'angle': (index * Math.PI / 2) + Math.PI / 2 * offset / boardSize
            }
        });
    }
}
