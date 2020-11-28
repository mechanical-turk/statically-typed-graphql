import { GraphQLEnumType } from 'graphql';
import * as t from 'io-ts';
import _ from 'lodash';
import {
  SemiBrick,
  Brick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';

interface StringKeys {
  [key: string]: unknown;
}

// TODO: expose the enum values as a public property.
// TODO: allow the developer to make the enums actually enumerable
export class EnumSemiBrick<D extends StringKeys>
  implements SemiBrick<'enum', GraphQLEnumType, keyof D> {
  public readonly kind = 'enum' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<keyof D>;
  public readonly keys: D;

  public readonly nullable: NullableBrickOf<EnumSemiBrick<D>>;
  public readonly nonNullable: NonNullableBrickOf<EnumSemiBrick<D>>;

  constructor(params: { name: string; semiCodec: Codec<keyof D>; keys: D }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.keys = params.keys;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLEnumType => {
    return new GraphQLEnumType({
      name: this.name,
      values: _.mapValues(this.keys, (_, key: string) => ({
        value: key,
        // TODO: expose deprecation reason via the values of the given keys
        // deprecationReason: 'some deprecation reason',
        // description: 'some description',
      })),
    });
  };

  public static init<D extends StringKeys>(params: {
    name: string;
    description?: string;
    keys: D;
  }): EnumSemiBrick<D> {
    return new EnumSemiBrick({
      name: params.name,
      keys: params.keys,
      semiCodec: t.keyof(params.keys),
    });
  }
}
