import { pathToFileURL } from "url";
import { Control } from "./components/Control";
import { DirProvider } from "./components/DirProvider";

export default new Control(new DirProvider(pathToFileURL(`${process.cwd()}/docs`)));
