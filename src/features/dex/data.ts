import raw from "../../data/characters.json";
import type { Character } from "../../types/character";

export const characters = raw as unknown as Character[];
