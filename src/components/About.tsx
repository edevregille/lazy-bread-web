import { Tile } from "./ui/Tile";

export default function About() {
    return (<div className="grid grid-cols-1 sm:grid-cols-1 gap-6 p-4 font-bold">
        <Tile title="About">
            <p>
                Lazy Bread PDX is a small business in Portland, Oregon that specializes in sourdough focaccia bread. We are currently in the process of launching and will be offering a side of soup soon. 
            </p>
            <br/>
            <br/>
            <p>
                Old fashioned bread made the lazy way: Minimal ingredients and naturally leavened. Feed it well and then leave to fatten up for 24 hours.
            </p>
        </Tile>
    </div>);
}