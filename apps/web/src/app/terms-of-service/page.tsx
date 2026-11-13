import React from 'react';
import {ChevronDown, CircleCheck, CircleUser, FileText, Heart, Lock, ShieldCheck} from 'lucide-react';

interface CollapsibleSectionProps {
	id: string;
	title: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	children: React.ReactNode;
	defaultOpen?: boolean;

}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
																																 id,
																																 title,
																																 icon: Icon,
																																 children,
																																 defaultOpen = false
																															 }) => {
	return (
		<div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
			<details className="group" open={defaultOpen}>
				<summary
					className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200 cursor-pointer list-none">
					<div className="flex items-center space-x-3">
						<Icon className="h-5 w-5 text-blue-600"/>
						<h3 className="text-lg font-medium text-gray-900">{title}</h3>
					</div>
					<ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-open:rotate-180"/>
				</summary>
				<div className="px-4 pb-4 border-t border-gray-100">
					<div className="pt-4 text-gray-700 leading-relaxed">
						{children}
					</div>
				</div>
			</details>
		</div>
	);
};


const TermsOfServicePage = () => {

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			<div className="relative max-w-4xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-blue-100 rounded-full">
							<FileText className="h-8 w-8 text-blue-600"/>
						</div>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
					<p className="text-gray-600 max-w-2xl mx-auto">
						MedConnect Pro is a portfolio demo that uses synthetic data only. Please review these
						terms before using it.
					</p>
					<div className="mt-4 text-sm text-gray-500">
						Last updated: November 13, 2026
					</div>
				</div>

				<div
					role="note"
					className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
				>
					<strong>Synthetic demo.</strong> This application contains no real patient data. Do not enter real
					patient or health information. It does not claim HIPAA compliance or certification and is not suitable for real
					patient data.
				</div>

				{/* Key Highlights */}
				<div className="grid md:grid-cols-3 gap-4 mb-8">
					<div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
						<ShieldCheck className="h-6 w-6 text-blue-600 mb-2"/>
						<h4 className="font-medium text-gray-900 mb-1">Synthetic demo</h4>
						<p className="text-sm text-gray-600">Synthetic data only. Do not enter real patient information.</p>
					</div>
					<div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
						<Lock className="h-6 w-6 text-green-600 mb-2"/>
						<h4 className="font-medium text-gray-900 mb-1">Demonstrated patterns</h4>
						<p className="text-sm text-gray-600">Role-based access, tenant isolation and audit logging.</p>
					</div>
					<div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
						<Heart className="h-6 w-6 text-purple-600 mb-2"/>
						<h4 className="font-medium text-gray-900 mb-1">Patient-Centered</h4>
						<p className="text-sm text-gray-600">Designed with patient privacy and care in mind</p>
					</div>
				</div>

				{/* Collapsible Sections */}
				<div className="space-y-4 mb-8">
					<CollapsibleSection
						id="acceptance"
						title="Acceptance of Terms"
						icon={CircleCheck}
					>
						<p className="mb-4">
							By accessing and using our healthcare platform (&quot;Service&quot;), you accept and agree to be bound by
							the terms
							and provision of this agreement. If you do not agree to abide by the above, please do not use this
							service.
						</p>
						<p>
							These terms apply to all users of the Service, including without limitation users who are healthcare
							providers, patients, administrators, and contributors of content.
						</p>
					</CollapsibleSection>

					<CollapsibleSection
						id="hipaa-privacy"
						title="Health information in this demo"
						icon={ShieldCheck}
					>
						<div className="space-y-4">
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<h4 className="font-medium text-blue-900 mb-2">Synthetic records only</h4>
								<p className="text-blue-800 text-sm">
									All patient records in this demo are synthetic. Health-information handling is modelled to
									demonstrate engineering patterns. It is not certified or assessed against HIPAA.
								</p>
							</div>
							<p>
								<strong>Data Collection:</strong> The demo stores synthetic records, such as medical records,
								treatment plans and billing entries, so that its workflows can be shown. Do not enter real health
								information.
							</p>
							<p>
								<strong>Data Use:</strong> Synthetic records are used only to demonstrate the product. They are not
								sold, rented or shared.
							</p>
							<p>
								<strong>Demonstrated safeguards:</strong> Role-based access control, tenant isolation with
								PostgreSQL row-level security, and audit logging are implemented in the demo.
							</p>
							<p>
								<strong>Real data:</strong> Because the demo holds no real patient data, no individual rights
								process (access, amendment, accounting of disclosures) is operated for it.
							</p>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						id="data-security"
						title="Demonstrated engineering patterns"
						icon={Lock}
					>
						<div className="space-y-4">
							<p>
								This demo shows engineering patterns used in healthcare software. It makes no claim of compliance
								or certification:
							</p>
							<div className="grid md:grid-cols-2 gap-4">
								<div className="bg-gray-50 p-3 rounded-lg">
									<h5 className="font-medium text-gray-900 mb-2">Implemented in the demo</h5>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Role-based access control</li>
										<li>• Tenant isolation with row-level security</li>
										<li>• Audit logging and a security-events viewer</li>
										<li>• Document access control</li>
									</ul>
								</div>
								<div className="bg-gray-50 p-3 rounded-lg">
									<h5 className="font-medium text-gray-900 mb-2">Planned, not deployed</h5>
									<ul className="text-sm text-gray-700 space-y-1">
										<li>• Production sign-in and multi-factor authentication</li>
										<li>• Encryption and network isolation as infrastructure properties</li>
									</ul>
								</div>
							</div>
							<p>
								<strong>Access Controls:</strong> The demo uses mock identity sessions and a labelled mock
								multi-factor challenge. These demonstrate the flow and are not production authentication.
							</p>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						id="user-responsibilities"
						title="User Responsibilities & Account Security"
						icon={CircleUser}
					>
						<div className="space-y-4">
							<p>
								As a user of our healthcare platform, you agree to:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>Provide accurate and complete information during registration and use</li>
								<li>Maintain the confidentiality of your account credentials</li>
								<li>Notify us immediately of any unauthorized access to your account</li>
								<li>Use the platform only for legitimate healthcare purposes</li>
								<li>Comply with all applicable healthcare regulations and laws</li>
								<li>Respect the privacy and confidentiality of other users&apos; information</li>
							</ul>
							<div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
								<p className="text-amber-800 text-sm">
									<strong>Important:</strong> You are responsible for all activities that occur under your account.
									Please keep your login credentials secure and log out after each session.
								</p>
							</div>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						id="service-availability"
						title="Service Availability & Limitations"
						icon={Heart}
					>
						<div className="space-y-4">
							<p>
								<strong>Service Uptime:</strong> This is a demo service with no uptime commitment. It may be
								unavailable or reset at any time.
							</p>
							<p>
								<strong>Emergency Situations:</strong> This platform is not intended for emergency medical situations.
								In case of medical emergencies, contact emergency services immediately (911 in the US).
							</p>
							<p>
								<strong>Clinical Decision Support:</strong> While our platform may provide clinical decision support
								tools, all medical decisions should be made by qualified healthcare professionals. Our tools are aids,
								not replacements for professional medical judgment.
							</p>
							<div className="bg-red-50 p-4 rounded-lg border border-red-200">
								<p className="text-red-800 text-sm font-medium">
									This platform does not provide medical advice, diagnosis, or treatment. Always consult with qualified
									healthcare providers for medical concerns.
								</p>
							</div>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						id="liability"
						title="Limitation of Liability & Disclaimers"
						icon={ShieldCheck}
					>
						<div className="space-y-4">
							<p>
								<strong>Service Disclaimer:</strong> The platform is provided &quot;as is&quot; without warranties of
								any kind. We
								do not warrant that the service will be uninterrupted, error-free, or free of harmful components.
							</p>
							<p>
								<strong>Medical Disclaimer:</strong> Information provided through the platform is for informational
								purposes only and should not be considered medical advice. Always seek the advice of qualified
								healthcare providers.
							</p>
							<p>
								<strong>Limitation of Liability:</strong> Our liability is limited to the maximum extent permitted by
								law. We shall not be liable for indirect, incidental, special, or consequential damages.
							</p>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						id="termination"
						title="Account Termination & Data Retention"
						icon={FileText}
					>
						<div className="space-y-4">
							<p>
								<strong>Termination Rights:</strong> Either party may terminate this agreement at any time. We reserve
								the right to suspend or terminate accounts that violate these terms.
							</p>
							<p>
								<strong>Data Retention:</strong> Upon account termination, we will retain your data according to legal
								requirements and our data retention policy. You may request data deletion subject to legal and
								regulatory obligations.
							</p>
							<p>
								<strong>Survival:</strong> Provisions regarding data protection, limitation of liability, and dispute
								resolution will survive termination of this agreement.
							</p>
						</div>
					</CollapsibleSection>
				</div>

				{/* Footer */}
				<div className="mt-8 text-center text-sm text-gray-500">
					<p>
						Questions about these terms? Contact our legal team at{' '}
						<a href="mailto:legal@yourplatform.com" className="text-blue-600 hover:underline">
							legal@yourplatform.com
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default TermsOfServicePage;