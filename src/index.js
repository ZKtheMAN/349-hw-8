import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
    let color;
    if (props.isWinMove) {
        if (props.value === 'X')
            color = "orange";
        else if (props.value === 'O')
            color = "aqua";
        // Undefined should be impossible on a winning move.
    } else {
        if (props.value === 'X')
            color = "red";
        else if (props.value === 'O')
            color = "blue";
        else
            color = "white";
    }

    return (
        <button 
            className="square" 
            onClick={props.onClick} 
            style={{backgroundColor: color}} 
        />
    )
}

class Board extends React.Component {
    renderSquare(i, j) {
        let isWinMove;
        if (this.props.winmove) {
            isWinMove = this.props.winmove[0] === i && this.props.winmove[1] === j
        } else {
            isWinMove = false;
        }

        return (
            <Square 
                value={this.props.squares[i][j]} 
                onClick={() => this.props.onClick(i, j)}
                key={[i, j]}
                isWinMove={isWinMove}
            />
        );
    }

    render() {
        let squarelist = [];
        for (var i = 0; i < this.props.squares.length; i++) {
            let rowSquareList = [];
            for (var j = 0; j < this.props.squares[i].length; j++) {
                rowSquareList.push(this.renderSquare(i, j));
            }

            squarelist.push(
                <div className="board-row" key={i}>
                    {rowSquareList}
                </div>
            )
        }

        return (
            <div>
                {squarelist}
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(6).fill().map(() => Array(7).fill(null)),
            }],
            xIsNext: true,
            stepNumber: 0,
            historyDescending: false
        }
    }

    lowestEmptyInCol(squares, j) {
        for (var i = squares.length - 1; i >= 0; i--) {
            if (squares[i][j] === null)
                return i;
        }
        return null;
    }

    handleClick(i, j) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        // This deep copies the multidimensional array - using current.squares.slice()
        // just makes a new array of pointers to the same subarrays
        const squares = current.squares.map((arr) => arr.slice());

        
        if (calculateWinner(squares)) {      
            return;    
        }
        
        const lowest = this.lowestEmptyInCol(squares, j);
        if (lowest !== null) {
            squares[lowest][j] = this.state.xIsNext? 'X' : 'O';
        }

        this.setState({
            history: history.concat([{
                squares: squares,
                delta: [lowest, j]
            }]),
            xIsNext: !this.state.xIsNext,
            stepNumber: history.length
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    descendOrder() {
        this.setState({
            historyDescending: !this.state.historyDescending
        })
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        let colorWinner;
        if (winner === "X")
            colorWinner = "Red";
        else if (winner === "O")
            colorWinner = "Blue";
        else if (winner === "Draw")
            colorWinner = winner;

        let moveBtnGenerator = (step, move) => {
            const desc = step.delta === undefined ?
                "Go to game start" :
                "Go to move #" + move + " (" + step.delta[0] + ", " + step.delta[1] + ")";

            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}
                            style={move === this.state.stepNumber ? {fontWeight: "bold"} : {}}>
                        {desc}
                    </button>
                </li>
            );
        }

        const moves = this.state.historyDescending ? 
            history.map(moveBtnGenerator).reverse() 
            : history.map(moveBtnGenerator);

        let status;
        if (winner) {
            status = "Winner: " + colorWinner;
        } else {
            status = "Next player: " + (this.state.xIsNext? 'Red' : 'Blue');
        }

        let winmove;
        if (winner) {
            winmove = current.delta;
        } else {
            winmove = undefined;
        }

        return (
            <div className="game">
                <div className="game-board">
                    <Board 
                        squares={current.squares}
                        onClick={(i, j) => this.handleClick(i, j)}
                        winmove={winmove}
                    />
                </div>
                <div className="game-info">
                    <div>{ status }</div>
                    <button onClick={() => this.descendOrder()}>
                        Order: {this.state.historyDescending? "Descending" : "Ascending"}
                    </button>
                    <ol>{ moves }</ol>
                </div>
            </div>
        );
    }
}

// Helper methods for victory condition checking

function horizontalWin(squares, i, j, n) {
    if (squares[i][j] === null) return false;
    if (n <= 1) return true;
    if (j <= 0) return false;
    return (squares[i][j] === squares[i][j - 1]) && horizontalWin(squares, i, j - 1, n - 1);
}

function verticalWin(squares, i, j, n) {
    if (squares[i][j] === null) return false;
    if (n <= 1) return true;
    if (i <= 0) return false;
    return (squares[i][j] === squares[i - 1][j]) && verticalWin(squares, i - 1, j, n - 1);
}

function diagLeftWin(squares, i, j, n) {
    if (squares[i][j] === null) return false;
    if (n <= 1) return true;
    if (i <= 0) return false;
    if (j <= 0) return false;
    return (squares[i][j] === squares[i - 1][j - 1]) && diagLeftWin(squares, i - 1, j - 1, n - 1);
}

function diagRightWin(squares, i, j, n) {
    if (squares[i][j] === null) return false;
    if (n <= 1) return true;
    if (i <= 0) return false;
    if (j >= squares[i].length - 1) return false;
    return (squares[i][j] === squares[i - 1][j + 1]) && diagRightWin(squares, i - 1, j + 1, n - 1);
}

function gameDraw(squares) {
    return squares[0].includes(null);
}

// Actual victory condition checking

function calculateWinner(squares) {
    for (var i = 0; i < squares.length; i++) {
        for (var j = 0; j < squares[i].length; j++) {
            if (horizontalWin(squares, i, j, 4)
             || verticalWin(squares, i, j, 4)
             || diagLeftWin(squares, i, j, 4)
             || diagRightWin(squares, i, j, 4))
                return squares[i][j];
        }
    }

    if (!gameDraw(squares)) return "Draw";

    return null;
}

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
