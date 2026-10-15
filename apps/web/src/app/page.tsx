import {redirect} from 'next/navigation';
import {LOGIN_PATH} from '@/lib/auth/paths';

export default function ApplicationEntryPage() {
	redirect(LOGIN_PATH);
}
