// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               v3.21.12
// source: questions_service.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from '@bufbuild/protobuf/wire';
import { ProtoArticleState, ProtoPdfState, ProtoYoutubeState } from './tauri_ipc.js';

export const protobufPackage = 'questions_service';

export interface ProtoChatMessage {
	role: string;
	content: string;
}

export interface VideoQuestionRequest {
	messages: ProtoChatMessage[];
	state: ProtoYoutubeState | undefined;
}

export interface VideoQuestionResponse {
	response: string;
}

export interface ArticleQuestionRequest {
	messages: ProtoChatMessage[];
	state: ProtoArticleState | undefined;
}

export interface ArticleQuestionResponse {
	response: string;
}

export interface PdfQuestionRequest {
	messages: ProtoChatMessage[];
	state: ProtoPdfState | undefined;
}

export interface PdfQuestionResponse {
	response: string;
}

function createBaseProtoChatMessage(): ProtoChatMessage {
	return { role: '', content: '' };
}

export const ProtoChatMessage: MessageFns<ProtoChatMessage> = {
	encode(message: ProtoChatMessage, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		if (message.role !== '') {
			writer.uint32(10).string(message.role);
		}
		if (message.content !== '') {
			writer.uint32(18).string(message.content);
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): ProtoChatMessage {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBaseProtoChatMessage();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.role = reader.string();
					continue;
				}
				case 2: {
					if (tag !== 18) {
						break;
					}

					message.content = reader.string();
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): ProtoChatMessage {
		return {
			role: isSet(object.role) ? globalThis.String(object.role) : '',
			content: isSet(object.content) ? globalThis.String(object.content) : ''
		};
	},

	toJSON(message: ProtoChatMessage): unknown {
		const obj: any = {};
		if (message.role !== '') {
			obj.role = message.role;
		}
		if (message.content !== '') {
			obj.content = message.content;
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<ProtoChatMessage>, I>>(base?: I): ProtoChatMessage {
		return ProtoChatMessage.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<ProtoChatMessage>, I>>(object: I): ProtoChatMessage {
		const message = createBaseProtoChatMessage();
		message.role = object.role ?? '';
		message.content = object.content ?? '';
		return message;
	}
};

function createBaseVideoQuestionRequest(): VideoQuestionRequest {
	return { messages: [], state: undefined };
}

export const VideoQuestionRequest: MessageFns<VideoQuestionRequest> = {
	encode(message: VideoQuestionRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		for (const v of message.messages) {
			ProtoChatMessage.encode(v!, writer.uint32(10).fork()).join();
		}
		if (message.state !== undefined) {
			ProtoYoutubeState.encode(message.state, writer.uint32(18).fork()).join();
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): VideoQuestionRequest {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBaseVideoQuestionRequest();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.messages.push(ProtoChatMessage.decode(reader, reader.uint32()));
					continue;
				}
				case 2: {
					if (tag !== 18) {
						break;
					}

					message.state = ProtoYoutubeState.decode(reader, reader.uint32());
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): VideoQuestionRequest {
		return {
			messages: globalThis.Array.isArray(object?.messages)
				? object.messages.map((e: any) => ProtoChatMessage.fromJSON(e))
				: [],
			state: isSet(object.state) ? ProtoYoutubeState.fromJSON(object.state) : undefined
		};
	},

	toJSON(message: VideoQuestionRequest): unknown {
		const obj: any = {};
		if (message.messages?.length) {
			obj.messages = message.messages.map((e) => ProtoChatMessage.toJSON(e));
		}
		if (message.state !== undefined) {
			obj.state = ProtoYoutubeState.toJSON(message.state);
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<VideoQuestionRequest>, I>>(base?: I): VideoQuestionRequest {
		return VideoQuestionRequest.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<VideoQuestionRequest>, I>>(
		object: I
	): VideoQuestionRequest {
		const message = createBaseVideoQuestionRequest();
		message.messages = object.messages?.map((e) => ProtoChatMessage.fromPartial(e)) || [];
		message.state =
			object.state !== undefined && object.state !== null
				? ProtoYoutubeState.fromPartial(object.state)
				: undefined;
		return message;
	}
};

function createBaseVideoQuestionResponse(): VideoQuestionResponse {
	return { response: '' };
}

export const VideoQuestionResponse: MessageFns<VideoQuestionResponse> = {
	encode(message: VideoQuestionResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		if (message.response !== '') {
			writer.uint32(10).string(message.response);
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): VideoQuestionResponse {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBaseVideoQuestionResponse();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.response = reader.string();
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): VideoQuestionResponse {
		return { response: isSet(object.response) ? globalThis.String(object.response) : '' };
	},

	toJSON(message: VideoQuestionResponse): unknown {
		const obj: any = {};
		if (message.response !== '') {
			obj.response = message.response;
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<VideoQuestionResponse>, I>>(base?: I): VideoQuestionResponse {
		return VideoQuestionResponse.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<VideoQuestionResponse>, I>>(
		object: I
	): VideoQuestionResponse {
		const message = createBaseVideoQuestionResponse();
		message.response = object.response ?? '';
		return message;
	}
};

function createBaseArticleQuestionRequest(): ArticleQuestionRequest {
	return { messages: [], state: undefined };
}

export const ArticleQuestionRequest: MessageFns<ArticleQuestionRequest> = {
	encode(message: ArticleQuestionRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		for (const v of message.messages) {
			ProtoChatMessage.encode(v!, writer.uint32(10).fork()).join();
		}
		if (message.state !== undefined) {
			ProtoArticleState.encode(message.state, writer.uint32(18).fork()).join();
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): ArticleQuestionRequest {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBaseArticleQuestionRequest();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.messages.push(ProtoChatMessage.decode(reader, reader.uint32()));
					continue;
				}
				case 2: {
					if (tag !== 18) {
						break;
					}

					message.state = ProtoArticleState.decode(reader, reader.uint32());
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): ArticleQuestionRequest {
		return {
			messages: globalThis.Array.isArray(object?.messages)
				? object.messages.map((e: any) => ProtoChatMessage.fromJSON(e))
				: [],
			state: isSet(object.state) ? ProtoArticleState.fromJSON(object.state) : undefined
		};
	},

	toJSON(message: ArticleQuestionRequest): unknown {
		const obj: any = {};
		if (message.messages?.length) {
			obj.messages = message.messages.map((e) => ProtoChatMessage.toJSON(e));
		}
		if (message.state !== undefined) {
			obj.state = ProtoArticleState.toJSON(message.state);
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<ArticleQuestionRequest>, I>>(
		base?: I
	): ArticleQuestionRequest {
		return ArticleQuestionRequest.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<ArticleQuestionRequest>, I>>(
		object: I
	): ArticleQuestionRequest {
		const message = createBaseArticleQuestionRequest();
		message.messages = object.messages?.map((e) => ProtoChatMessage.fromPartial(e)) || [];
		message.state =
			object.state !== undefined && object.state !== null
				? ProtoArticleState.fromPartial(object.state)
				: undefined;
		return message;
	}
};

function createBaseArticleQuestionResponse(): ArticleQuestionResponse {
	return { response: '' };
}

export const ArticleQuestionResponse: MessageFns<ArticleQuestionResponse> = {
	encode(
		message: ArticleQuestionResponse,
		writer: BinaryWriter = new BinaryWriter()
	): BinaryWriter {
		if (message.response !== '') {
			writer.uint32(10).string(message.response);
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): ArticleQuestionResponse {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBaseArticleQuestionResponse();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.response = reader.string();
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): ArticleQuestionResponse {
		return { response: isSet(object.response) ? globalThis.String(object.response) : '' };
	},

	toJSON(message: ArticleQuestionResponse): unknown {
		const obj: any = {};
		if (message.response !== '') {
			obj.response = message.response;
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<ArticleQuestionResponse>, I>>(
		base?: I
	): ArticleQuestionResponse {
		return ArticleQuestionResponse.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<ArticleQuestionResponse>, I>>(
		object: I
	): ArticleQuestionResponse {
		const message = createBaseArticleQuestionResponse();
		message.response = object.response ?? '';
		return message;
	}
};

function createBasePdfQuestionRequest(): PdfQuestionRequest {
	return { messages: [], state: undefined };
}

export const PdfQuestionRequest: MessageFns<PdfQuestionRequest> = {
	encode(message: PdfQuestionRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		for (const v of message.messages) {
			ProtoChatMessage.encode(v!, writer.uint32(10).fork()).join();
		}
		if (message.state !== undefined) {
			ProtoPdfState.encode(message.state, writer.uint32(18).fork()).join();
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): PdfQuestionRequest {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBasePdfQuestionRequest();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.messages.push(ProtoChatMessage.decode(reader, reader.uint32()));
					continue;
				}
				case 2: {
					if (tag !== 18) {
						break;
					}

					message.state = ProtoPdfState.decode(reader, reader.uint32());
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): PdfQuestionRequest {
		return {
			messages: globalThis.Array.isArray(object?.messages)
				? object.messages.map((e: any) => ProtoChatMessage.fromJSON(e))
				: [],
			state: isSet(object.state) ? ProtoPdfState.fromJSON(object.state) : undefined
		};
	},

	toJSON(message: PdfQuestionRequest): unknown {
		const obj: any = {};
		if (message.messages?.length) {
			obj.messages = message.messages.map((e) => ProtoChatMessage.toJSON(e));
		}
		if (message.state !== undefined) {
			obj.state = ProtoPdfState.toJSON(message.state);
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<PdfQuestionRequest>, I>>(base?: I): PdfQuestionRequest {
		return PdfQuestionRequest.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<PdfQuestionRequest>, I>>(object: I): PdfQuestionRequest {
		const message = createBasePdfQuestionRequest();
		message.messages = object.messages?.map((e) => ProtoChatMessage.fromPartial(e)) || [];
		message.state =
			object.state !== undefined && object.state !== null
				? ProtoPdfState.fromPartial(object.state)
				: undefined;
		return message;
	}
};

function createBasePdfQuestionResponse(): PdfQuestionResponse {
	return { response: '' };
}

export const PdfQuestionResponse: MessageFns<PdfQuestionResponse> = {
	encode(message: PdfQuestionResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
		if (message.response !== '') {
			writer.uint32(10).string(message.response);
		}
		return writer;
	},

	decode(input: BinaryReader | Uint8Array, length?: number): PdfQuestionResponse {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		let end = length === undefined ? reader.len : reader.pos + length;
		const message = createBasePdfQuestionResponse();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) {
						break;
					}

					message.response = reader.string();
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) {
				break;
			}
			reader.skip(tag & 7);
		}
		return message;
	},

	fromJSON(object: any): PdfQuestionResponse {
		return { response: isSet(object.response) ? globalThis.String(object.response) : '' };
	},

	toJSON(message: PdfQuestionResponse): unknown {
		const obj: any = {};
		if (message.response !== '') {
			obj.response = message.response;
		}
		return obj;
	},

	create<I extends Exact<DeepPartial<PdfQuestionResponse>, I>>(base?: I): PdfQuestionResponse {
		return PdfQuestionResponse.fromPartial(base ?? ({} as any));
	},
	fromPartial<I extends Exact<DeepPartial<PdfQuestionResponse>, I>>(
		object: I
	): PdfQuestionResponse {
		const message = createBasePdfQuestionResponse();
		message.response = object.response ?? '';
		return message;
	}
};

export interface QuestionsService {
	VideoQuestion(request: VideoQuestionRequest): Promise<VideoQuestionResponse>;
	ArticleQuestion(request: ArticleQuestionRequest): Promise<ArticleQuestionResponse>;
	PdfQuestion(request: PdfQuestionRequest): Promise<PdfQuestionResponse>;
}

export const QuestionsServiceServiceName = 'questions_service.QuestionsService';
export class QuestionsServiceClientImpl implements QuestionsService {
	private readonly rpc: Rpc;
	private readonly service: string;
	constructor(rpc: Rpc, opts?: { service?: string }) {
		this.service = opts?.service || QuestionsServiceServiceName;
		this.rpc = rpc;
		this.VideoQuestion = this.VideoQuestion.bind(this);
		this.ArticleQuestion = this.ArticleQuestion.bind(this);
		this.PdfQuestion = this.PdfQuestion.bind(this);
	}
	VideoQuestion(request: VideoQuestionRequest): Promise<VideoQuestionResponse> {
		const data = VideoQuestionRequest.encode(request).finish();
		const promise = this.rpc.request(this.service, 'VideoQuestion', data);
		return promise.then((data) => VideoQuestionResponse.decode(new BinaryReader(data)));
	}

	ArticleQuestion(request: ArticleQuestionRequest): Promise<ArticleQuestionResponse> {
		const data = ArticleQuestionRequest.encode(request).finish();
		const promise = this.rpc.request(this.service, 'ArticleQuestion', data);
		return promise.then((data) => ArticleQuestionResponse.decode(new BinaryReader(data)));
	}

	PdfQuestion(request: PdfQuestionRequest): Promise<PdfQuestionResponse> {
		const data = PdfQuestionRequest.encode(request).finish();
		const promise = this.rpc.request(this.service, 'PdfQuestion', data);
		return promise.then((data) => PdfQuestionResponse.decode(new BinaryReader(data)));
	}
}

interface Rpc {
	request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin
	? T
	: T extends globalThis.Array<infer U>
		? globalThis.Array<DeepPartial<U>>
		: T extends ReadonlyArray<infer U>
			? ReadonlyArray<DeepPartial<U>>
			: T extends {}
				? { [K in keyof T]?: DeepPartial<T[K]> }
				: Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
	? P
	: P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
	return value !== null && value !== undefined;
}

export interface MessageFns<T> {
	encode(message: T, writer?: BinaryWriter): BinaryWriter;
	decode(input: BinaryReader | Uint8Array, length?: number): T;
	fromJSON(object: any): T;
	toJSON(message: T): unknown;
	create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
	fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
