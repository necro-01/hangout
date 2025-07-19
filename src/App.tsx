import React from 'react';
import { PhaserGame } from './components/PhaserGame';
import './App.scss';

const App: React.FC = () => {
    return (
        <div className="app-container">
            <div className="game-wrapper">
                <PhaserGame />
            </div>
        </div>
    );
};

export default App;