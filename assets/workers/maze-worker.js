const directions = [[0, -1], [+1, 0], [0, +1], [-1, 0]];
let cells = [];
let markedCells = [];
let searchTree = null;

// Thanks to Stephanie Wong https://medium.com/@stephaniewo/understanding-breadth-first-tree-traversal-with-javascript-9b8fe670176d
const buildBFTree = function (startXY, parentNode) {
    markedCells = copyMazeWithMarks();
    const queue = [];
    const root = treeNode(parentNode, startXY);
    queue.push(root);
    markCell(startXY);

    while (queue.length > 0) {
        const node = queue.shift();
        directions.forEach((direction, i) => {
            const neighbour = getNeighbourXY(node.xy, i);
            if (neighbour && !cells[neighbour[1]][neighbour[0]]) {
                if (unMarkedCell(neighbour)) {
                    markCell(neighbour);
                    const nextNode = treeNode(node, neighbour);
                    node.children.push(nextNode);
                    queue.push(nextNode);
                }
            }
        });
    }
    return root;
};

const clearData = function () {
    startPosition = null;
    searchTree = null;
    markedCells = [];
};

const copyMazeWithMarks = function () {
    return cells.map(row => {
        return row.map(cell => {
            return false;
        });
    });
};

const findPositionHalfway = function (targetPositionSets) {
    const isTargetPosition = (xy) => targetPositionSets.some(positionSet => positionSet.some(position => position.every((coordinate, i) => coordinate == xy[i])));
    const queue = [];
    const targets = [];
    const results = [];
    const root = searchTree;
    queue.push(root);
    while (queue.length > 0) {
        let node = queue.shift();
        node.children.forEach(child => {
            queue.push(child);
        });
        if (isTargetPosition(node.xy)) {
            targets.push(node);
        }
    }
    if (targets.length) {
        targets.forEach(node => {
            const halfdepth = Math.ceil(node.depth / 2);
            let currentNode = node;
            while (currentNode.depth > halfdepth) {
                currentNode = currentNode.parent;
            }
            results.push(currentNode.xy);
        });
    }
    return results;
};

const getNeighbourXY = function (xy, direction) {
    const neighbourPosition = xy.map((xy, i) => {
        return xy += directions[direction][i];
    });
    const withinBounds = neighbourPosition.every(coord => {
        return coord >= 0 && coord < cells.length;
    });
    return withinBounds ? neighbourPosition : false;
};

const getPositionHalfway = function (data) {
    const position = data.position;
    searchTree = buildBFTree(position, null); // TODO: kan ook in initVariables
    const targetPositions = findPositionHalfway(data.targetPositions);
    sendFeedBack('faassenPositions', targetPositions);
};

const initVariables = function (data) {
    cells = data.cells;
};

const markCell = function (xy) {
    markedCells[xy[1]][xy[0]] = true;
};

const sendFeedBack = function (message, positions) {
    const workerData = {
        message: message,
        positions: positions
    };
    postMessage(workerData);
};

let treeNode = function (parent, xy, depth) {
    return {
        parent: parent,
        children: [],
        xy: xy,
        depth: parent ? parent.depth + 1 : 0
    };
};

let unMarkedCell = function (xy) {
    return !markedCells[xy[1]][xy[0]];
};

onmessage = function (e) {
    let message = e.data.message;
    switch (message) {
        case 'initMaze':
            initVariables(e.data);
            break;
        case 'getPositionHalfway':
            getPositionHalfway(e.data);
            break;
        default:
            break;
    }
};
