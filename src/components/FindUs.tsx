import React from "react";
import { Title } from "./ui/Title";
import Image from "next/image";
import { FIND_US_LOCATIONS } from "@/config/app-config";

export default function FindUs() {
  return (
    <section className="background-gradient-warm py-16">
      <div className="max-w-6xl mx-auto px-8">
        <h1 className="text-4xl font-semibold text-bakery-primary mb-10 text-center font-body">Find us</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FIND_US_LOCATIONS.filter((location) => location.active).map((location) => (
            <Title key={location.id} title={location.name}>
              <div className="flex justify-center">
                <Image
                  src={location.image}
                  alt={location.imageAlt}
                  className="w-100 h-64 object-cover rounded-t-lg"
                  width={420}
                  height={400}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-700 mb-2 font-medium font-body">
                  <span aria-hidden="true">📍 </span>
                  {location.address}
                </p>
                <p className="text-amber-700 mb-4 font-semibold font-body bg-amber-50 px-3 py-1 rounded-full inline-block">
                  <span aria-hidden="true">🕒 </span>
                  {location.schedule}
                </p>
              </div>
            </Title>
          ))}
        </div>
      </div>
    </section>
  );
}
