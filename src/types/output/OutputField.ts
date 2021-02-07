import { GraphQLFieldConfig } from 'graphql';
import { mapValues } from 'lodash';
import { AnyTypeContainer } from '../../TypeContainer';
import { OutputRealizedType } from '../core';
import { toInputField } from '../input/InputField';
import { ArgsMap } from '../input/ArgsMap';
import {
  ArgsMapInOutputMapValue,
  OutputFieldsMapValue,
  TypeInOutputMapValue,
} from './OutputFieldsMap';
import { brandOf } from '../../utils';

export interface OutputFieldConstructorParams<
  R extends OutputRealizedType,
  M extends ArgsMap
> {
  type: R;
  args: M;
  deprecationReason?: string;
  description?: string;
}

export class OutputField<R extends OutputRealizedType, M extends ArgsMap> {
  public readonly type: R;
  public readonly args: M;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: OutputFieldConstructorParams<R, M>) {
    this.type = params.type;
    this.args = params.args;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLFieldConfig(params: {
    typeContainer: AnyTypeContainer;
    objectName?: string;
    fieldName: string;
  }): GraphQLFieldConfig<any, any, any> {
    return {
      type: this.type.getGraphQLType(params.typeContainer) as any,
      args: mapValues(this.args, (arg) => {
        const inputField = toInputField(arg);
        return inputField.getGraphQLInputFieldConfig(params.typeContainer);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
      resolve: params.objectName
        ? (params.typeContainer.getFieldResolver(
            params.objectName,
            params.fieldName,
          ) as any)
        : undefined,
    };
  }
}

export const toOutputField = <
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
>(
  v: V,
): OutputField<TypeInOutputMapValue<V>, ArgsMapInOutputMapValue<V>> => {
  if (brandOf(v as any) == 'realizedtype') {
    return new OutputField({ type: v as any, args: {} as any });
  } else {
    return new OutputField(v as any);
  }
};
