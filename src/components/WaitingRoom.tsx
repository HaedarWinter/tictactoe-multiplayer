import React from 'react';

interface WaitingRoomProps {
  roomId: string;
  players: any[];
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomId,
  players,
  isHost,
  onStartGame,
  onLeaveRoom
}) => {
  // Check if we have two players
  const canStartGame = players.length === 2;
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Waiting Room</h2>
      
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" id="room-id-label">Room ID:</label>
          <div className="flex">
            <input
              type="text"
              value={roomId}
              readOnly
              className="w-full p-2 bg-gray-100 border rounded"
              aria-labelledby="room-id-label"
              title="Room ID"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                alert('Room ID copied to clipboard!');
              }}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Share this code with a friend to play together
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Players ({players.length}/2):</h3>
          
          {players.map((player, index) => (
            <div key={index} className="bg-gray-100 p-3 rounded mb-2 flex justify-between items-center">
              <div>
                <span className="font-medium">{player.name}</span>
                {player.isHost && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Host</span>}
              </div>
              <div className="text-gray-500">
                {index === 0 ? 'X' : 'O'}
              </div>
            </div>
          ))}
          
          {players.length < 2 && (
            <div className="bg-gray-100 p-3 rounded mb-2 border-2 border-dashed border-gray-300 text-center text-gray-500">
              Waiting for opponent...
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className={`w-full py-2 rounded font-medium ${
              canStartGame
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canStartGame ? 'Start Game' : 'Waiting for Players...'}
          </button>
        )}
        
        <button
          onClick={onLeaveRoom}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default WaitingRoom; 