const Ball = require('../objects/Ball.js');
const Table = require('../objects/Table.js');
const Vector = require('../objects/Vector.js');
const FileManager = require('./../utilities/fileManager');

const parameters = require('./parameters.json');

const table = new Table();
const balls = [];

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
     * For now just a dummy method later make sure to adjust x,y
     */
    initBalls() {
        console.log('Hi!')
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
        //FIX THIS TO COUNT WITH INNER DIMENSIONS NOT OUTER!
        const tableWidth = ((this.table.width * (262/224)) * ((data.height) / (this.table.height* (150/112)))) * (224/262);
        this.table.width = tableWidth;
        this.table.height = data.height;

        const offsetWidth = (data.windowWidth - tableWidth) / 2;
        this.table.x = offsetWidth;

        this.balls.forEach((el, index) => {
            if (index === 0) {
                el.x = el.x + offsetWidth;
                el.radius = data.radiusWhite;
            } else {
                el.x = el.x + offsetWidth;
                el.radius = data.radius;
            }
        });

        FileManager.updateGames(id, 'game', {
            table: this.table,
            balls: this.balls
        })
    }

    computeInitialPositions(id) {
        const strictPosArray = [];
        const randomizePosArray = [];

        this.balls[0].x = (this.table.width / 4) + table.x;
        this.balls[0].y = this.table.height / 2;

        const centerBall = {
            x: ((this.table.width / 4) * 3) + this.table.x,
            y: this.table.height / 2
        };
        randomizePosArray.push({
            x: centerBall.x - (4 * this.balls[1].radius),
            y: centerBall.y
        });
        strictPosArray.push(centerBall, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y + (4 * this.balls[1].radius)/2
        }, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y - (4 * this.balls[1].radius)/2
        });
        randomizePosArray.push({
            x: centerBall.x - (2 * this.balls[1].radius),
            y: centerBall.y + (this.balls[1].radius)/2,
        }, {
            x: centerBall.x,
            y: centerBall.y + (2 * this.balls[1].radius)/2
        }, {
            x: centerBall.x + (2 * this.balls[1].radius),
            y: centerBall.y + (this.balls[1].radius)/2,
        }, {
            x: centerBall.x + (2 * this.balls[1].radius),
            y: centerBall.y + (3 * this.balls[1].radius)/2,
        }, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y
        }, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y + (2 * this.balls[1].radius)/2,
        }, { //opposite vv
            x: centerBall.x - (2 * this.balls[1].radius),
            y: centerBall.y - (this.balls[1].radius)/2,
        }, {
            x: centerBall.x,
            y: centerBall.y - (2 * this.balls[1].radius)/2
        }, {
            x: centerBall.x + (2 * this.balls[1].radius),
            y: centerBall.y - (this.balls[1].radius)/2,
        }, {
            x: centerBall.x + (2 * this.balls[1].radius),
            y: centerBall.y - (3 * this.balls[1].radius)/2,
        }, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y - (2 * this.balls[1].radius)/2,
        }, {
            x: centerBall.x + (4 * this.balls[1].radius),
            y: centerBall.y - (2 * this.balls[1].radius)/2,
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
                x: el.x < (this.table.width / 2 + table.x) ? -el.x - el.radius : el.x / 2 - 4*el.radius,
                y: -el.y
            }
        });
        console.log(response);
        return response;
    }
}