import { print, parse } from "graphql";

// Nooop gql fn for prettier
export function gql(...things: TemplateStringsArray[]) {
    return print(parse(things.join(""))).trim();
}
