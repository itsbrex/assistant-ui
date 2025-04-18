import { JSONSchema7 } from "json-schema";
import { TypeAtPath, TypePath } from "./type-path-utils";
import { DeepPartial } from "ai";
import { AsyncIterableStream } from "../../utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ToolResponse } from "./ToolResponse";

/**
 * Interface for reading tool call arguments from a stream, which are
 * generated by a language learning model (LLM). Provides methods to
 * retrieve specific values, partial streams, or complete items from
 * an array, based on a specified path.
 *
 * @template TArgs The type of arguments being read.
 */
export interface ToolCallArgsReader<TArgs> {
  /**
   * Returns a promise that will resolve to the value at the given path,
   * as soon as that path is generated by the LLM.
   *
   * @param fieldPath An array of object keys or array indices.
   */
  get<PathT extends TypePath<TArgs>>(
    ...fieldPath: PathT
  ): Promise<TypeAtPath<TArgs, PathT>>;

  /**
   * Returns a stream that will emit partial values at the given path,
   * as they are generated by the LLM.
   *
   * @param fieldPath An array of object keys or array indices.
   */
  streamValues<PathT extends TypePath<TArgs>>(
    ...fieldPath: PathT
  ): AsyncIterableStream<DeepPartial<TypeAtPath<TArgs, PathT>>>;

  /**
   * Returns a stream that will emit partial text at the given path,
   * as they are generated by the LLM.
   *
   * @param fieldPath An array of object keys or array indices.
   */
  streamText<PathT extends TypePath<TArgs>>(
    ...fieldPath: PathT
  ): TypeAtPath<TArgs, PathT> extends string & infer U
    ? AsyncIterableStream<U>
    : never;

  /**
   * Returns a stream that will emit complete items in the array
   * at the given path, as they are generated by the LLM.
   *
   * @param fieldPath An array of object keys or array indices.
   */
  forEach<PathT extends TypePath<TArgs>>(
    ...fieldPath: PathT
  ): TypeAtPath<TArgs, PathT> extends Array<infer U>
    ? AsyncIterableStream<U>
    : never;
}

export interface ToolCallResponseReader<TResult> {
  get: () => Promise<ToolResponse<TResult>>;
}

export interface ToolCallReader<TArgs, TResult> {
  args: ToolCallArgsReader<TArgs>;
  response: ToolCallResponseReader<TResult>;

  /**
   * @deprecated Deprecated. Use `response.get().result` instead.
   */
  result: {
    get: () => Promise<TResult>;
  };
}

type ToolExecutionContext = {
  toolCallId: string;
  abortSignal: AbortSignal;
};

export type ToolExecuteFunction<TArgs, TResult> = (
  args: TArgs,
  context: ToolExecutionContext,
) => TResult | Promise<TResult>;

export type ToolStreamCallFunction<TArgs, TResult> = (
  reader: ToolCallReader<TArgs, TResult>,
  context: ToolExecutionContext,
) => void;

type OnSchemaValidationErrorFunction<TResult> = ToolExecuteFunction<
  unknown,
  TResult
>;

export type Tool<TArgs = unknown, TResult = unknown> = {
  description?: string | undefined;
  parameters: StandardSchemaV1<TArgs> | JSONSchema7;
  execute?: ToolExecuteFunction<TArgs, TResult>;
  /**
   * @deprecated Experimental, API may change.
   */
  streamCall?: ToolStreamCallFunction<TArgs, TResult>;
  experimental_onSchemaValidationError?: OnSchemaValidationErrorFunction<TResult>;
};
