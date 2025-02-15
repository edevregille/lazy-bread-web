import { Tile } from "./ui/Tile";

export default function About() {
    return (<div className="grid grid-cols-1 sm:grid-cols-1 gap-6 p-4 font-bold">
        <Tile title="About">
            <p>
            Welcome to Lazy Bread! A small cottage bakery in the heart of the Piedmont neighborhood in North Portland. Ever since getting the hang of baking with sourdough about ten years ago, our family of 5 is stocked with a loaf of homemade bread at all times (and when we do run out, you can probably find an emergency loaf hiding in the freezer!). 
            <br/>
            <br/>    
            Sourdough does take longer to rise than store-bought bread (I let mine go for at least 24 hours!), but I don’t believe that naturally risen bread with minimal ingredients is worth all the fuss it gets. Don’t get me wrong, it is damn delicious, has health benefits, and is oh-so-satisfying to make, but it isn’t a luxury product. 
            <br/><br/>
            My goal with Lazy Bread is to create delicious, unassuming bread at a more accessible price point. 
            <br/><br/>
            Sign up for my mailing list for updates on how and where to buy Lazy Bread! 
            </p>
        </Tile>
    </div>);
}