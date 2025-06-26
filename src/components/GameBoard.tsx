import React from 'react';

interface GameBoardProps {
  board: Array<string | null>;
  winningLine: number[] | null;
  onSquareClick: (position: number) => void;
  isPlayerTurn: boolean;
  gameStatus: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningLine,
  onSquareClick,
  isPlayerTurn,
  gameStatus
}) => {
  // Function to determine if a square is part of the winning line
  const isWinningSquare = (index: number) => {
    return winningLine !== null && winningLine.includes(index);
  };
  
  // Function to determine if a player can make a move on a square
  const canMakeMove = (index: number) => {
    return (
      gameStatus === 'playing' &&
      isPlayerTurn &&
      board[index] === null
    );
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-center mb-6">Tic-Tac-Toe</h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4 max-w-md mx-auto">
        {board.map((value, index) => (
          <button
            key={index}
            className={`
              aspect-square flex items-center justify-center
              text-4xl font-bold rounded 
              ${isWinningSquare(index) ? 'bg-green-800 border-green-600' : 'bg-slate-700'}
              ${canMakeMove(index) ? 'cursor-pointer hover:bg-slate-600' : 'cursor-default'}
              border-2 transition-all duration-200
            `}
            onClick={() => canMakeMove(index) && onSquareClick(index)}
            disabled={!canMakeMove(index)}
          >
            {value}
          </button>
        ))}
      </div>
      
      {gameStatus === 'playing' && (
        <div className="text-center py-2 bg-blue-900 rounded">
          {isPlayerTurn ? (
            <p className="font-semibold">Your turn</p>
          ) : (
            <p>Waiting for opponent...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GameBoard; 