import React from 'react';
import { Tile } from './ui/Tile';

export default function Contact () {
  return (
    <Tile
      title={"Find Us"}
    >
      <div className="text-gray-700 mb-4">
        Lazy Bread LLC is at the Woodlawn Farmers Market every Saturday 
      </div>
      <div className="text-gray-700 mb-4">
        You can contact us directly at lazybreadpdx@gmail.com.
      </div>
    </Tile>
  );
};