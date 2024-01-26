import {
  createContainer,
  asValue,
  InjectionMode,
  asClass,
  AwilixContainer,
  asFunction
} from "awilix";
import { Log4brainsConfig } from "@src/infrastructure/config";
import * as adrCommandHandlers from "@src/adr/application/command-handlers";
import * as adrQueryHandlers from "@src/adr/application/query-handlers";
import { CommandHandler, QueryHandler } from "@src/application";
import * as repositories from "@src/adr/infrastructure/repositories";
import { CommandBus, QueryBus } from "../buses";
import { FileWatcher } from "../file-watcher";

function lowerCaseFirstLetter(string: string): string {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function buildContainer(
  config: Log4brainsConfig,
  workdir = "."
): AwilixContainer {
  const container: AwilixContainer = createContainer({
    injectionMode: InjectionMode.PROXY
  });

  // Configuration & misc
  container.register({
    config: asValue(config),
    workdir: asValue(workdir),
    fileWatcher: asClass(FileWatcher).singleton()
  });

  // Repositories

  Object.entries(repositories).forEach(([key, Repository]) => {
    container.register(
      lowerCaseFirstLetter(key),
      asClass<unknown>(Repository).singleton()
    );
  });

  // Command handlers
  Object.entries(adrCommandHandlers).forEach(([key, Handler]) => {
    container.register(key, asClass<CommandHandler>(Handler).singleton());
  });

  // Command bus
  container.register({
    commandBus: asFunction(() => {
      const bus = new CommandBus();

      Object.entries(adrCommandHandlers).forEach(([key]) => {
        const handlerInstance = container.resolve<CommandHandler>(key);
        bus.registerHandler(handlerInstance, handlerInstance.commandClass);
      });

      return bus;
    }).singleton()
  });

  // Query handlers
  Object.entries(adrQueryHandlers).forEach(([key, Handler]) => {
    container.register(key, asClass<QueryHandler>(Handler).singleton());
  });

  // Query bus
  container.register({
    queryBus: asFunction(() => {
      const bus = new QueryBus();

      Object.entries(adrQueryHandlers).forEach(([key]) => {
        const handlerInstance = container.resolve<QueryHandler>(key);
        bus.registerHandler(handlerInstance, handlerInstance.queryClass);
      });

      return bus;
    }).singleton()
  });

  return container;
}
