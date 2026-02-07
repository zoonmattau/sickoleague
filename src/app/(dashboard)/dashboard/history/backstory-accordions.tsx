"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Building2, MapPin, Users } from "lucide-react";
import type { BackstoryData } from "./actions";

export function ClubHistories({ clubs }: { clubs: BackstoryData["clubs"] }) {
  if (clubs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Club Histories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {clubs.map((club) => (
            <AccordionItem key={club.id} value={club.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start gap-3">
                  <span
                    className="px-3 py-1 rounded text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: club.primaryColor || "#6b7280",
                      color: club.secondaryColor || "#ffffff",
                    }}
                  >
                    {club.abbreviation}
                  </span>
                  <div className="text-left">
                    <span className="font-semibold text-base">{club.name}</span>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {club.founded && <span>Est. {club.founded}</span>}
                      {club.cityName && <span>Based in {club.cityName}</span>}
                      {club.venueName && <span>Home: {club.venueName}</span>}
                    </div>
                    {club.reservesName && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Reserves: {club.reservesName}
                        {club.townName && ` (${club.townName})`}
                        {club.reservesVenueName && ` at ${club.reservesVenueName}`}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {club.history ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-14">
                    {club.history}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic pl-14">
                    No history recorded yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function CityHistories({ cities }: { cities: BackstoryData["cities"] }) {
  if (cities.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-500" />
          City Histories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {cities.map((city) => (
            <AccordionItem key={city.id} value={city.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="text-left">
                  <span className="font-semibold text-base">{city.name}, {city.state}</span>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {city.founded && <span>Founded {city.founded}</span>}
                    <span>Pop. {city.population.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {city.marketSize} Market
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {city.description && (
                  <p className="text-sm mb-2">{city.description}</p>
                )}
                {city.history ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {city.history}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No history recorded yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function TownHistories({ towns }: { towns: BackstoryData["towns"] }) {
  if (towns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-500" />
          Town Histories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          {towns.map((town) => (
            <AccordionItem key={town.id} value={town.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="text-left">
                  <span className="font-semibold text-base">{town.name}, {town.state}</span>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {town.founded && <span>Founded {town.founded}</span>}
                    <span>Pop. {town.population.toLocaleString()}</span>
                    {town.nearCityName && <span>Near {town.nearCityName}</span>}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {town.description && (
                  <p className="text-sm mb-2">{town.description}</p>
                )}
                {town.history ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {town.history}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No history recorded yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
