import { Tile } from "./ui/Tile";
import Image from "next/image";
import aboutImg from '../../public/about.png';

export default function About() {
    return (
        <section id="about" className="flex justify-center p-8 mb-10">
            <div className="w-full">
                <Tile title="About">
                    <div className="flex sm:gap-x-20">               
                        <div className="flex-[1]">
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
                        </div>

                        <div className="hidden md:block flex-[1]">
                            <Image 
                                src={aboutImg} 
                                alt="Lazy Bread" 
                                className="object-cover rounded-lg" 
                                width={400}
                            />
                        </div>
                    </div>
                </Tile>
            </div>
        </section>);
}