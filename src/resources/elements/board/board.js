import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator, Element)
export class BoardCustomElement {

    bricks = [];
    blocks = [];
    bricksCount = 25;
    blockSize = 5;
    boardSize = Math.round(100 / this.blockSize);

    constructor(eventAggregator, element) {
        this._element = element;
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._scatterBricks();
        this._element.style.setProperty('--blockSize', this.blockSize + "vmin");
    }

    detached() {
    }

    _randomNumberWithin(max) {
        return Math.floor(Math.random() * max);
    }

    _getBlockPosition(position, direction) {
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        const directionVector = directions[direction];
        const position2 = {
            left: position.left + directionVector[0],
            top: position.top + directionVector[1]
        };
        return position2;
    }

    _positionIsFree(position, direction) {
        const position2 = this._getBlockPosition(position, direction);
        const isFree = !this.blocks.some(block => block.left == position.left && block.top == position.top);
        const p2isFree = !this.blocks.some(block => block.left == position2.left && block.top == position2.top);
        const withinBounds =
            position.left >= 0 && position.left < this.boardSize &&
            position.top >= 0 && position.top < this.boardSize &&
            position2.left >= 0 && position2.left < this.boardSize &&
            position2.top >= 0 && position2.top < this.boardSize;
        // !withinBounds && console.log(position, direction);
        return isFree && p2isFree && withinBounds;
    }

    _setPosition(brick) {
        let positionFound, count = 0, maxPositions = Math.pow(2, this.boardSize);
        const position = {}
        let direction;
        do {
            count++;
            direction = this._randomNumberWithin(4);
            position.left = this._randomNumberWithin(this.boardSize);
            position.top = this._randomNumberWithin(this.boardSize);
            positionFound = this._positionIsFree(position, direction);
        } while (!positionFound && count < maxPositions); // geen goede check
        // console.log(position, direction);
        if (positionFound) {
            brick.position = position;
            brick.direction = direction;
        }
        return positionFound;
    }

    _scatterBricks() {
        for (let i = 0; i < this.bricksCount; i++) {
            const brick = {
                index: i,
                position: {},
                direction: undefined
            }
            if (this._setPosition(brick)) {
                this.bricks.push(brick);
                this.blocks.push(brick.position);
                this.blocks.push(this._getBlockPosition(brick.position, brick.direction));
            };
        }
    }

}
