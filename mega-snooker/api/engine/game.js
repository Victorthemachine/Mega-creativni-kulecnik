const Ball = require('../objects/Ball.js');
const Hole = require('../objects/Hole.js');
const Table = require('../objects/Table.js');
const Vector = require('../objects/Vector.js');
const FileManager = require('./../utilities/fileManager');

const parameters = require('./parameters.json');

const table = new Table();
const balls = [];
const pockets = [];
const ballsMoving = {
    moving: [],
    collision: []
}
const canPlayBlack = [];
const winner = []
const lastHole = [];
const playingFull = [];
const ballsRemaining = [];
//TODO Add check for holes!
/**
 * Game manager... controls all elements for a game
 * 
 */
module.exports = class Game {

    /**
     * Initializes a game (creates table and balls)
     */
    constructor() {
        this.table = table;
        this.balls = balls;
        if (this.balls.length === 0) {
            this.initBalls();
        }
        this.pockets = pockets;
        if (this.pockets.length === 0) {
            this.initPockets();
        }
        this.ballsMoving = ballsMoving;
        this.player = 1;
        this.foul = undefined;
        this.moves = 1;
        this.canPlayBlack = canPlayBlack;
        this.canPlayBlack = [false, false];
        this.winner = winner;
        this.winner = [false, false];
        this.lastHole = lastHole;
        this.playingFull = playingFull;
        this.playingFull = [false, false];
        this.ballsRemaining = ballsRemaining;
        this.ballsRemaining = [7, 7];
        this.blackHole = undefined;
    }

    run(id, cueCords) {

        }
        /**
         * Checks whether the ball collides with the table.
         * This is accomplished by finding a point on the table. 
         * Using 2 vertical lines to the table connecting two possible points and center of the ball.
         * 
         * Diagram:
         * 
         *                  |
         *                  |
         * -----------------X-------|
         *                  |       |
         *                  |       |
         * -----------------X-------X-------
         *                  |       |
         *                  |       |
         * 
         * @param {Ball} ball 
         * 
         * @returns {Boolean} true  - collision
         *                    false - no collision
         */
    checkCollisionBtT(ball) {
        if (ball.hidden) return false;
        let pointOnTable = { first: { x: 0, y: 0 }, second: { x: 0, y: 0 } };
        switch (table.getBallPositionQuadrant(ball)) {
            case 'LEFT BOTTOM':
                pointOnTable.first = { x: ball.x, y: table.y };
                pointOnTable.second = { x: table.x, y: ball.y };
                break;
            case 'RIGHT BOTTOM':
                pointOnTable.first = { x: ball.x, y: table.y };
                pointOnTable.second = { x: table.width + table.x, y: ball.y };
                break;
            case 'LEFT TOP':
                pointOnTable.first = { x: ball.x, y: table.height };
                pointOnTable.second = { x: table.x, y: ball.y };
                break;
            case 'RIGHT TOP':
                pointOnTable.first = { x: ball.x, y: table.height };
                pointOnTable.second = { x: table.width + table.x, y: ball.y };
                break;
        }
        if (Math.sqrt(Math.pow(ball.x - pointOnTable.first.x, 2) + Math.pow(ball.y - pointOnTable.first.y, 2)) <= ball.radius || Math.sqrt(Math.pow(ball.x - pointOnTable.second.x, 2) + Math.pow(ball.y - pointOnTable.second.y, 2)) <= ball.radius) {
            return true;
        }
        return false;
    }

    /**
     * Gets array of all Ball objects currently in use
     * 
     * @returns {Array} array of all Ball objects
     */
    getBalls() {
        let temp = [];
        balls.forEach(el => {
            if (!el.hidden) temp.push(el);
        })
        return temp;
    }

    /**
     * Currently a dummy method as well.. need to fix it up later
     */
    initTable() {

    }

    /**
     * For now just a dummy method later make sure to adjust x,y <= doesn't matter
     * We already adjust sizes and x/y in updateSizes()
     */
    initBalls() {
        console.log('Initilizing balls...')
        for (let i = 0; i < 16; i++) {
            balls.push(new Ball(i, {
                x: i,
                y: i,
                hidden: false,
            }))
            balls[i].vector = new Vector(i + 2, i, undefined, undefined, {
                owner: balls[i].id
            })
        }
    }

    initPockets() {
        console.log('Initilizing pockets...');
        this.pockets.push(new Hole(0, {
            x: table.x - 11.25 / 2,
            y: table.y - 11.25 / 2,
            radius: 11.25 / 2
        }));
        this.pockets.push(new Hole(1, {
            x: table.x + table.width / 2,
            y: table.y - 12.5 / 2,
            radius: 12.5 / 2
        }));
        this.pockets.push(new Hole(2, {
            x: (table.x + table.width) + 11.25 / 2,
            y: table.y + 11.25 / 2,
            radius: 11.25 / 2
        }));
        this.pockets.push(new Hole(3, {
            x: table.x - 11.25 / 2,
            y: (table.y + table.height) + 11.25 / 2,
            radius: 11.25 / 2
        }));
        this.pockets.push(new Hole(4, {
            x: table.x + table.width / 2,
            y: (table.y + table.height) + 12.5 / 2,
            radius: 12.5 / 2
        }));
        this.pockets.push(new Hole(5, {
            x: table.x + table.width + 11.25 / 2,
            y: table.y + table.height + 11.25 / 2,
            radius: 11.25 / 2
        }));
    }
    checkAndComputeCollisionBtPs(ball) {
            this.pockets.forEach((el, index) => {
                if (Math.sqrt(Math.pow(el.x - ball.x, 2) + Math.pow(el.y - ball.y, 2)) <= el.radius) {
                    this.lastHole[this.player] = index;
                    ball.hidden = true;
                    ball.vector.force = 0;
                    if (ball.id != 0 && ball.id != 8) {
                        if (!this.playingFull[0] && !this.playingFull[1]) {
                            if (ball.id < 8) {
                                this.playingFull[this.player - 1] = true;

                            } else {
                                try {
                                    this.playingFull[this.player - 2] = true;
                                } catch (ex) {
                                    this.playingFull[this.player] = true;
                                }
                            }
                            this.ballsRemaining[this.player - 1]--;

                        } else {
                            if (ball.id < 8) {
                                if (this.playingFull[0]) {
                                    this.ballsRemaining[0]--;
                                } else {
                                    this.ballsRemaining[1]--;
                                }
                            } else {
                                if (this.playingFull[0]) {
                                    this.ballsRemaining[1]--;
                                } else {
                                    this.ballsRemaining[0]--;
                                }
                            }
                        }
                    } else {
                        if (ball.id === 8) {
                            this.blackHole = index;
                        }
                    }
                    return true;
                }
            });
            return false;
        }
        /**
         * Checks if two supplied balls are colliding or not.
         * 
         * @param {Ball} ball_1 
         * @param {Ball} ball_2 
         * 
         * @returns {Boolean} true  - collision
         *                    false - no collision
         */
    checkCollisionBtB(ball_1, ball_2) {
        console.log(`Hidden? ${ball_1.hidden || ball_2.hidden}`);
        if (ball_1.hidden || ball_2.hidden) return false;
        if (Math.sqrt(Math.pow(ball_2.x - ball_1.x, 2) + Math.pow(ball_2.y - ball_1.y, 2)) <= (ball_1.radius + ball_2.radius)) {
            return true;
        }
        return false;
    }

    /**
     * Computes the vector after the collision.
     * 
     * @param {Ball} ball 
     * 
     * @returns {Vector} vector after the collision
     */
    computeBtTCollision(ball) {
        if (ball.hidden) return false;
        let pointOnTable = { first: { x: 0, y: 0 }, second: { x: 0, y: 0 } };
        let quadrant = table.getBallPositionQuadrant(ball);
        switch (quadrant) {
            case 'LEFT BOTTOM':
                pointOnTable.first = { x: ball.x, y: table.y };
                pointOnTable.second = { x: table.x, y: ball.y };
                break;
            case 'RIGHT BOTTOM':
                pointOnTable.first = { x: ball.x, y: table.y };
                pointOnTable.second = { x: table.width + table.x, y: ball.y };
                break;
            case 'LEFT TOP':
                pointOnTable.first = { x: ball.x, y: table.height };
                pointOnTable.second = { x: table.x, y: ball.y };
                break;
            case 'RIGHT TOP':
                pointOnTable.first = { x: ball.x, y: table.height };
                pointOnTable.second = { x: table.width + table.x, y: ball.y };
                break;
        }
        let point;

        if (Math.sqrt(Math.pow(ball.x - pointOnTable.first.x, 2) + Math.pow(ball.y - pointOnTable.first.y, 2)) <= ball.radius) {
            point = pointOnTable.first;
            quadrant = quadrant.split(' ')[1];
        } else if (Math.sqrt(Math.pow(ball.x - pointOnTable.second.x, 2) + Math.pow(ball.y - pointOnTable.second.y, 2)) <= ball.radius) {
            point = pointOnTable.second;
            quadrant = quadrant.split(' ')[0];
        }
        console.log(point);
        console.log(quadrant);
        if (point === undefined) throw new Error('TRIED TO COMPUTE COLLISION BALL TO TABLE BUT POINT IS UNDEFINED');

        let bounceAngle;

        switch (quadrant) {
            case 'LEFT':
                if (90 <= ball.vector.angle <= 180) { //i.e. it's in the second quadrant vector wise
                    bounceAngle = (90 - (ball.vector.angle - 90));
                } else { //i.e. it's in the third quadrant vector wise
                    bounceAngle = 360 - (ball.vector.angle - 180);
                }
                break;
            case 'RIGHT':
                if (0 <= ball.vector.angle <= 90) { //i.e. it's in the first quadrant vector wise
                    bounceAngle = 180 - (90 - (90 - ball.vector.angle));
                } else { //i.e. it's in the fourth quadrant vector wise
                    bounceAngle = 180 + (90 - (90 - (360 - ball.vector.angle)));
                }
                break;
            case 'BOTTOM':
                if (180 <= ball.vector.angle <= 270) { //i.e. it's in the third quadrant vector wise
                    bounceAngle = 2 * (270 - ball.vector.angle) + (90 - (270 - ball.vector.angle));
                } else { //i.e. it's in the fourth quadrant vector wise
                    bounceAngle = 90 - (90 - (360 - ball.vector.angle));
                }
                break;
            case 'TOP':
                if (0 <= ball.vector.angle <= 90) { //i.e. it's in the first quadrant vector wise
                    bounceAngle = 360 - (90 - (90 - ball.vector.angle));
                } else { //i.e. it's in the second quadrant vector wise
                    bounceAngle = 180 + (90 - (ball.vector.angle - 90));
                }
                break;
        }

        ball.vector.setVector(bounceAngle, ball.vector.force);

    }

    computeColisions() {
        if (ballsMoving.collision.lenght === 0) return;
        ballsMoving.collision.forEach(el => {
            let temp = [];
            for (let i in el) {
                temp.push(i);
            }
            temp.length === 1 ? computeBtTCollision(temp[0]) : computeBtBCollision(temp[0], temp[1]);
        });
        ballsMoving.collision.splice(0);
    }
    computeBtBCollision(ball1, ball2) {
        let temp1 = ball1;
        let temp2 = ball2;
        ball2.vector = new Vector(ball1.x, ball1.y, ball2.x, ball.y);
        /*let angleAdjasment = (ball2.vector.getangle(ball1.vector) / 2);
        if (Math.abs(ball2.vector.angle - ball1.vector.angle) <= 90) {
            angleAdjasment += ball2.vector.angle < ball1.vector.angle ? ball2.vector.angle : ball1.vector.angle;
        } else {
            angleAdjasment += ball2.vector.angle > ball1.vector.angle ? ball2.vector.angle : ball1.vector.angle;
            angleAdjasment -= angleAdjasment >= 360 ? 360 : 0;

        }*/
        let a = new Vector(ball2.vector.x, ball2.vector.y);
        if (Math.abs(a.angle - ball1.vector.angle) > 180) {
            if (a.angle < ball1.vector.angle) {
                a.angle += 360
            } else {
                ball1.vector.angle += 360;
            }
        }
        a.angle += a.angle - ball1.vector.angle;
        ball1.vector.setVector(a.angle, 10);
        ball1.vector = new Vector(-ball1.vector.x, -ball1.vector.y);
        let koeficent = Math.sin(ball1.vector.getAngle(ball2.vector))
        ball1.vector.force *= koeficent;
        ball2.vector.force *= (1 - koeficent);
        temp1.vector = new Vector(temp2.x, temp2.y, temp1.x, temp1.y);
        a = new Vector(temp1.vector.x, temp1.vector.y);
        if (Math.abs(a.angle - temp2.vector.angle) > 180) {
            if (a.angle < temp2.vector.angle) {
                a.angle += 360
            } else {
                temp2.vector.angle += 360;
            }
        }
        a.angle += a.angle - temp2.vector.angle;
        temp2.vector.setVector(a.angle, 10);
        temp2.vector = new Vector(-temp2.vector.x, -temp2.vector.y);
        let koeficent = Math.sin(temp2.vector.getAngle(temp2.vector))
        temp2.vector.force *= koeficent;
        temp1.vector.force *= (1 - koeficent);
        ball1.vector.add(temp1.vector);
        ball2.vector.add(temp2.vector);
    }

    /**
     * Computes collision of two balls
     * 
     * @param {Ball} ball_1 
     * @param {Ball} ball_2
     */
    /*computeBtBCollision(ball_1, ball_2) {
        
        }*/

    /**
     * Updates sizes based on supplied parameters
     * 
     * @param {JSON} data 
     */
    updateSizes(id, data) {
        this.table.height = data.height * (112 / 150);
        this.table.width = data.height * (224 / 150);

        const offsetWidth = (data.windowWidth - this.table.width) / 2;
        this.table.x = offsetWidth;
        const offsetHeight = (data.height - this.table.height) / 2;
        this.table.y = offsetHeight;

        this.balls.forEach((el, index) => {
            el.x += offsetWidth;
            el.y += offsetHeight;
            if (index === 0) {
                el.radius = data.radiusWhite;
            } else {
                el.radius = data.radius;
            }
        });

        this.pockets.forEach(el => {
            el.x += offsetWidth;
            el.y += offsetHeight;
            el.radius = el.radius * (this.table.width / 224);
        });

        FileManager.updateGames(id, 'game', {
            table: this.table,
            balls: this.balls
        });
    }

    computeInitialPositions(id) {
        const strictPosArray = [];
        const randomizePosArray = [];

        this.balls[0].x = ((this.table.width + this.table.x) / 4);
        this.balls[0].y = (this.table.height) / 2 + this.table.y;

        const somethingLikeTheRadiusButNotQuite = this.balls[1].radius * 0.88;

        const centerBall = {
            x: (((this.table.width + this.table.x) / 4) * 3),
            y: (this.table.height / 2) + this.table.y
        };
        console.log((this.table.height / 2) + this.table.y)
        randomizePosArray.push({
            x: centerBall.x - (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y
        });
        strictPosArray.push(centerBall, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y + (4 * this.balls[1].radius) / 2
        }, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (4 * this.balls[1].radius) / 2
        });
        randomizePosArray.push({
            x: centerBall.x - (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y + (this.balls[1].radius) / 2,
        }, {
            x: centerBall.x,
            y: centerBall.y + (2 * this.balls[1].radius) / 2
        }, {
            x: centerBall.x + (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y + (this.balls[1].radius) / 2,
        }, {
            x: centerBall.x + (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y + (3 * this.balls[1].radius) / 2,
        }, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y
        }, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y + (2 * this.balls[1].radius) / 2,
        }, { //opposite vv
            x: centerBall.x - (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (this.balls[1].radius) / 2,
        }, {
            x: centerBall.x,
            y: centerBall.y - (2 * this.balls[1].radius) / 2
        }, {
            x: centerBall.x + (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (this.balls[1].radius) / 2,
        }, {
            x: centerBall.x + (somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (3 * this.balls[1].radius) / 2,
        }, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (2 * this.balls[1].radius) / 2,
        }, {
            x: centerBall.x + (2 * somethingLikeTheRadiusButNotQuite),
            y: centerBall.y - (2 * this.balls[1].radius) / 2,
        });

        //Adjust fixed positions
        this.balls[8].x = strictPosArray[0].x;
        this.balls[8].y = strictPosArray[0].y;

        const ballsToGoThrough = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
        if ((Math.random() * 10) % 2 === 0) {
            console.log('EVEN');
            let nominee = Math.floor(Math.random() * 7);
            console.log(nominee);
            this.balls[ballsToGoThrough[nominee]].x = strictPosArray[1].x;
            this.balls[ballsToGoThrough[nominee]].y = strictPosArray[1].y;
            ballsToGoThrough.splice(nominee, 1);
            console.log(ballsToGoThrough);
            nominee = Math.floor(Math.random() * (ballsToGoThrough.length - 6) + 6);
            console.log(nominee);
            this.balls[ballsToGoThrough[nominee]].x = strictPosArray[2].x;
            this.balls[ballsToGoThrough[nominee]].y = strictPosArray[2].y;
            ballsToGoThrough.splice(nominee, 1);
            console.log(ballsToGoThrough);
        } else {
            console.log('ODD');
            let nominee = Math.floor(Math.random() * (ballsToGoThrough.length - 7) + 7);
            console.log(nominee);
            this.balls[ballsToGoThrough[nominee]].x = strictPosArray[1].x;
            this.balls[ballsToGoThrough[nominee]].y = strictPosArray[1].y;
            ballsToGoThrough.splice(nominee, 1);
            console.log(ballsToGoThrough);
            nominee = Math.floor(Math.random() * 7);
            console.log(nominee);
            this.balls[ballsToGoThrough[nominee]].x = strictPosArray[2].x;
            this.balls[ballsToGoThrough[nominee]].y = strictPosArray[2].y;
            ballsToGoThrough.splice(nominee, 1);
            console.log(ballsToGoThrough);
        }
        console.log(ballsToGoThrough);
        let lenghtOfArray = ballsToGoThrough.length;
        for (let i = 0; i < lenghtOfArray; i++) {
            let nominee = Math.floor(Math.random() * (ballsToGoThrough.length - 1));
            console.log(`Lenght: ${ballsToGoThrough.length}, Random: ${nominee}`);
            console.log(ballsToGoThrough);
            console.log(randomizePosArray[i]);
            console.log(this.balls[nominee]);
            this.balls[ballsToGoThrough[nominee]].x = randomizePosArray[i].x;
            this.balls[ballsToGoThrough[nominee]].y = randomizePosArray[i].y;
            ballsToGoThrough.splice(nominee, 1);
        }
        FileManager.updateGames(id, 'balls', this.balls);
        let response = {};
        this.balls.forEach((el, index) => {
            response[index] = {
                x: el.x - (((this.table.x + this.table.width + el.radius) / 2)),
                y: -el.y
            }
        });
        console.log(response);
        return response;
    }
    areBallsStill() {
        areStill = true;
        balls.forEach((el, index) => {
            if (!el.vector.force === 0) {
                this.ballsMoving.moving.push(index)
                areStill = false
            }

        });
        return areStill;
    }
    opositPocket(index) {
        switch (index) {
            case 0:
                return 5;
                break;
            case 1:
                return 4;
                break;
            case 2:
                return 3;
                break;
            case 3:
                return 2;
                break;
            case 4:
                return 1;
                break;
            case 5:
                return 0;
                break;
        }
    }
    blackHandler() {
        if (this.balls[8].hidden) {
            if (this.canPlayBlack[this.player - 1] && this.opositPocket(this.lastHole[this.player - 1]) === this.blackHole) {
                winner[this.player - 1] = true;
            } else {
                winner[this.player - 1] = true;
            }
        }
    }

    whiteHandler() {
        if (this.balls[0].hidden) {
            this.foul = true;
            this.balls[0].x = (this.table.width / 4) + this.table.x;
            this.balls[0].y = (this.table.height / 2) + this.table.y;
        }
    }
    moveCalculater() {
        if (this.foul) {
            this.player = this.player === 1 ? 2 : 1;
            this.moves = 2;
        } else {
            this.moves--;
            if (this.moves < 1) {
                this.player = this.player === 1 ? 2 : 1;
            }
        }
    }
    foulHandler(firstColision) {
        if (this.ballsMoving.moving.length > 1) {
            if (firstColision) {
                firstColision = false;
                if (!this.playingFull[0] && !this.playingFull[1]) {

                } else {
                    if (this.canPlayBlack[this.player - 1]) {
                        if (this.playingFull[this.player - 1]) {
                            if (this.ballsMoving.moving[1] > 8) {
                                this.foul = true;
                            }
                        } else {
                            if (this.ballsMoving.moving[1] < 8) {
                                this.foul = true;
                            }
                        }
                    } else {
                        if (this.playingFull[this.player - 1]) {
                            if (this.ballsMoving.moving[1] > 7) {
                                this.foul = true;
                            }
                        } else {
                            if (this.ballsMoving.moving[1] < 9) {
                                this.foul = true;
                            }
                        }
                    }
                }
            } else {
                if (this.foul === undefined) {
                    this.foul = false;
                }
            }
        }
    }
    canPlayBlackHandler() {
        if (this.ballsRemaining[0] === 0) {
            this.canPlayBlack[0] = true;
        }
        if (this.ballsRemaining[1] === 0) {
            this.canPlayBlack[1] = true;
        }
    }
    sendingProtocol() {

    }
    gameWizard(Vector) {
        let firstColision = true;
        this.foul = undefined;
        this.balls[0].vector = Vector;
        let timestemp = 0;
        while (!this.areBallsStill) {
            timestemp++;
            this.computeColisions();
            this.foulHandler(firstColision);
            for (let i = 0; i < this.ballsMoving.moving.length; i++) {
                let temp = this.balls[this.ballsMoving.moving[i]];
                temp.x += temp.vector.x;
                temp.y += temp.vector.y;
                temp.vector.force *= parameters.tableConstantDeceleration;
                if (this.checkCollisionBtT(temp)) {
                    ballsMoving.collision.push({ temp });
                }
                this.balls.forEach((el) => {
                    if (this.checkCollisionBtB(temp, el)) {
                        if (!this.ballsMoving.collision.find(elem => {
                                return Object.is(elem, { el, temp });
                            })) {
                            this.ballsMoving.collision.push({ temp, el });
                        }
                    }
                });
                this.checkAndComputeCollisionBtPs();
            }
            this.sendingProtocol();
        }
        if (this.foul === undefined) {
            this.foul = true;
        }
        this.canPlayBlackHandler();
        this.blackHandler();
        this.whiteHandler();
        this.moveCalculater();
    }
}