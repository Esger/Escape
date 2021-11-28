export class StateService {

    _bricks = [];
    _blocks = [];
    _bricksCount = 25;
    _blockSize = 5;
    _boardSize = Math.round(100 / this._blockSize);
    _pusher = {
        position: {
            left: Math.round(this._boardSize / 2),
            top: Math.round(this._boardSize / 2)
        }
    };

    constructor() {
        this._blocks.push(this._pusher.position);
    }

    getBricks() { return this._bricks; }

    getBlockSize() { return this._blockSize; }

    getPusherPosition() {
        return this._pusher.position;
    }

    canMoveTo(position) {
        const isFree = this._isFree(position);
        const withinBounds = this._withinBounds(position);
        return isFree && withinBounds;
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

    _withinBounds(position) {
        const withinBounds =
            position.left >= 0 && position.left < this._boardSize &&
            position.top >= 0 && position.top < this._boardSize;
        return withinBounds;
    }

    _isFree(position) {
        const isFree = !this._blocks.some(block => block.left == position.left && block.top == position.top);
        return isFree;
    }

    _positionIsFree(position, direction) {
        const position2 = this._getBlockPosition(position, direction);
        const isFree = this._isFree(position) && this._isFree(position2);
        const withinBounds = this._withinBounds(position) && this._withinBounds(position2);
        return isFree && withinBounds;
    }

    _setPosition(brick) {
        let positionFound, count = 0, maxPositions = Math.pow(2, this._boardSize);
        const position = {}
        let direction;
        do {
            count++;
            direction = this._randomNumberWithin(4);
            position.left = this._randomNumberWithin(this._boardSize);
            position.top = this._randomNumberWithin(this._boardSize);
            positionFound = this._positionIsFree(position, direction);
        } while (!positionFound && count < maxPositions); // geen goede check
        if (positionFound) {
            brick.position = position;
            brick.direction = direction;
        }
        return positionFound;
    }

    initialize() {
        for (let i = 0; i < this._bricksCount; i++) {
            const brick = {
                index: i,
                position: {},
                direction: undefined
            }
            if (this._setPosition(brick)) {
                this._bricks.push(brick);
                this._blocks.push(brick.position);
                this._blocks.push(this._getBlockPosition(brick.position, brick.direction));
            };
        }
        this._blocks.shift();
    }
}
