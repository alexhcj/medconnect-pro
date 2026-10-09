import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

@Entity({name: 'oauth_flow_states'})
@Index('oauth_flow_states_expires_at_idx', ['expiresAt'])
export class OAuthFlowState {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({type: 'varchar', length: 32})
	provider!: string;

	@Column({name: 'state_hash', type: 'varchar', length: 64, unique: true})
	stateHash!: string;

	@Column({name: 'code_verifier', type: 'varchar', length: 128})
	codeVerifier!: string;

	@Column({type: 'varchar', length: 128})
	nonce!: string;

	@Column({name: 'return_to', type: 'varchar', length: 2048})
	returnTo!: string;

	@Column({name: 'expires_at', type: 'timestamptz'})
	expiresAt!: Date;

	@Column({name: 'consumed_at', type: 'timestamptz', nullable: true})
	consumedAt!: Date | null;

	@Column({name: 'created_at', type: 'timestamptz', default: () => 'now()'})
	createdAt!: Date;
}
