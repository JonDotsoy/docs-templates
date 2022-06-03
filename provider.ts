import { pathToFileURL } from "url";
import { Control } from "./components/_control";
import { DirProvider } from "./components/modules/control/providers/dir-provider";

export default new Control(new DirProvider(pathToFileURL(`${process.cwd()}/docs`)));
