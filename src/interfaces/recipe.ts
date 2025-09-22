import { Process } from "./process";

export interface Recipe {
  id?: string;
  name?: string;
  processes: Process[];
}
