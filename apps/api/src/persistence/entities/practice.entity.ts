import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity({name: 'practices'})
export class Practice {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({type: 'varchar', length: 200})
	name!: string;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
