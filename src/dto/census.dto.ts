import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CheckStatusDto {
    @IsNotEmpty({ message: 'La cédula es obligatoria' })
    @IsString()
    @Length(10, 10, { message: 'La cédula debe tener exactamente 10 dígitos' })
    @Matches(/^[0-9]+$/, { message: 'La cédula debe contener solo números' })
    cedula: string;
}
