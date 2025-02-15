import React from 'react';
import { Tile } from './ui/Tile';

export default function Contact () {
  return (
    <Tile
      title={"Find Us"}
    >
      <div className="text-gray-700 mb-4 font-bold">
    
        <p>
          Every weekends at Café Eleven (435 NE Rosa Parks, Portland OR 97211)
        </p>
        <br/>
        <br/>
        <p> 
          Woodlawn Indoor Farmers Market every second Saturday from 11:00 - 2:00 ( March - May 2025). 
        </p>
      </div>
    </Tile>
  );
};