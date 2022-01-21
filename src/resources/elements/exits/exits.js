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
        this._boardSize = this._stateService.getBoardSize();
        this._blockSize = this._stateService.getBlockSize();
        this._firstTime = true;
    }

    attached() {
        this._setExits();
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._addGiveUpSubscription();
            this._element.style.setProperty('--exitColor', 'lime');
            this.positions = [];
            this._setExits();
        });
    }

    detached() {
        this._giveUpSubscription?.dispose();
        this._gameStartSubscription.dispose();
    }

    _addGiveUpSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => {
            this._element.style.setProperty('--exitColor', 'red');
        });
    }

    _setExits() {
        const level = this._stateService.getLevel();
        const max = this._boardSize;
        const offset = 2 + ((level + 8) % 17); // 1..18
        // this._beforeExits are just inside the board, in front of the exits.
        this._beforeExits = [
            [[offset, 0], [offset - 1, 0]],
            [[max - 1, offset], [max - 1, offset - 1]],
            [[max - offset, max - 1], [max - offset - 1, max - 1]],
            [[0, max - offset], [0, max - offset - 1]]
        ];

        let outwardsVectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        // this._exits are just outside the board.
        this._exits = this._beforeExits.map((beforeExit, index) => beforeExit.map(vector => {
            const newVector = this._stateService.sumVectors(vector, outwardsVectors[index]);
            return newVector;
        }));
        // wait for bricks to be initialized.
        setTimeout(_ => {
            !this._firstTime && this._eventAggregator.publish('exitsReady', { 'exits': this._exits, 'beforeExits': this._beforeExits });
            this._firstTime = false;
        });

        outwardsVectors = [[0, 0], [1, 0], [0, 1], [0, 0]];
        // positions for visual exits one further out on the far sides
        const exitPositions = this._exits.map((exit, index) => exit.map(vector => {
            const newVector = this._stateService.sumVectors(vector, outwardsVectors[index]);
            return newVector;
        }));
        const positions = exitPositions.map(exit => this._stateService.multiplyVector(exit[0], this._blockSize));

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
