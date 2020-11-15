/* eslint @typescript-eslint/no-empty-interface: 0 */
import { ApolloServer, gql, UserInputError } from 'apollo-server-express';
import * as R from 'fp-ts/lib/Record';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import express from 'express';
import { data } from './cached/data';
import * as t from 'io-ts';
import { Lens } from 'monocle-ts';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLList,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLOutputType,
  GraphQLInputObjectType,
  GraphQLType,
  GraphQLScalarType,
  GraphQLNullableType,
  graphqlSync,
  isInputObjectType,
} from 'graphql';
import { flow, not, pipe } from 'fp-ts/lib/function';
import { isLeft } from 'fp-ts/lib/Either';
import _ from 'lodash';

type Codec<A, O> = t.Type<A, O, unknown>;

type Shape =
  | 'scalar'
  | 'object'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'list';

interface IType {
  shape: Shape;
}

interface IScalar extends IType {
  shape: 'scalar';
}

interface IObject extends IType {
  shape: 'object';
}

interface IInterface extends IType {
  shape: 'interface';
}

interface IUnion extends IType {
  shape: 'union';
}

interface IEnum extends IType {
  shape: 'enum';
}

interface IInputObject extends IType {
  shape: 'inputobject';
}

interface IList extends IType {
  shape: 'list';
}

/** */

// interface IUnrealisedGraphQLType extends IType {
//   __unrealisedGraphQLType: GraphQLNullableType;
// }

// interface IRealisedGrapQLTypes extends IUnrealisedGraphQLType {
//   __realisedGraphqlType: GraphQLType;
// }

/** */

interface ISemiBrick extends IType {
  name: string;
  unrealisedGraphQLType: GraphQLNullableType;
  unrealisedCodec: Codec<any, any>;
}

type Nullability = 'nullable' | 'notNullable';

interface IBrick extends ISemiBrick {
  nullability: Nullability;
  realisedGraphQLType: GraphQLType;
  realisedCodec: Codec<any, any>;
}

/** */

interface IScalarSemiBrick extends ISemiBrick {
  shape: 'scalar';
  unrealisedGraphQLType: GraphQLScalarType;
}

interface IScalarBrick extends IBrick {
  shape: 'scalar';
  realisedGraphQLType: GraphQLScalarType | GraphQLNonNull<GraphQLScalarType>;
}

// TODO: if we dont reuse the semiBrick within the brick, then what's the point? How can we keep them centralized?

const id = {
  name: 'ID' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.union([t.string, t.number]),
  unrealisedGraphQLType: GraphQLID,
};

const string = {
  name: 'String' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.string,
  unrealisedGraphQLType: GraphQLString,
};

const float = {
  name: 'Float' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.number,
  unrealisedGraphQLType: GraphQLFloat,
};

const int = {
  name: 'Int' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.Int,
  unrealisedGraphQLType: GraphQLInt,
};

const boolean = {
  name: 'Boolean' as const,
  shape: 'scalar' as const,
  unrealisedCodec: t.boolean,
  unrealisedGraphQLType: GraphQLBoolean,
};

const core = {
  id,
  string,
  float,
  int,
  boolean,
};

// TODO: still not able to carry codec information...
const makeNullable = <T extends ISemiBrick>(sb: T) => {
  return {
    ...sb,
    nullability: 'nullable' as const,
    realisedCodec: t.union([sb.unrealisedCodec, t.undefined, t.null]),
    realisedGraphQLType: sb.unrealisedGraphQLType,
  };
};

const makeNotNullable = <T extends ISemiBrick>(sb: T) => {
  return {
    // TODO: shoule we point back to the semibrick from the main brick?
    ...sb,
    nullability: 'notNullable' as const,
    realisedCodec: sb.unrealisedCodec,
    realisedGraphQLType: new GraphQLNonNull(sb.unrealisedGraphQLType),
  };
};

const lift = <T extends ISemiBrick>(sb: T) => {
  return {
    ...makeNotNullable(sb),
    nullable: makeNullable(sb),
  };
};

const liftedId = lift(id);

// nullable.id.realisedCodec.encode(undefined);

// const nullableString = {
//   ...stringSemiBrick,
// };

// const nBrick: IBrick = nullableString;

// type OutputOf<T> = T extends IBrick ? T['realisedCodec']['_A'] : never;
// type a = OutputOf<typeof nullableString>;

// const semiBricks = {};

// // TODO: is there a way for ScalarBrick to implement IBrick and IScalar at the same time?
// // TODO: as things stand, there's no straightforward way to make sure that the scalars passed for realised & unrealised gql types will refer to the same gql object.
// // TODO: how can we infer things now?
