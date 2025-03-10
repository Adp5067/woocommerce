/**
 * External dependencies
 */
import { WooOnboardingTask } from '@woocommerce/onboarding';
import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';
import { Icon, chevronUp, chevronDown } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { getAdminLink } from '@woocommerce/settings';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import Stacks from '../experimental-products/stack';
import CardList from './CardList';
import { importTypes } from './importTypes';
import './style.scss';
import useProductTypeListItems from '../experimental-products/use-product-types-list-items';
import { getProductTypes } from '../experimental-products/utils';
import LoadSampleProductModal from '../components/load-sample-product-modal';
import useLoadSampleProducts from '../components/use-load-sample-products';
import LoadSampleProductConfirmModal from '../components/load-sample-product-confirm-modal';
import useRecordCompletionTime from '../use-record-completion-time';

export const Products = () => {
	const [ showStacks, setStackVisibility ] = useState< boolean >( false );
	const { recordCompletionTime } = useRecordCompletionTime( 'products' );
	const [
		isConfirmingLoadSampleProducts,
		setIsConfirmingLoadSampleProducts,
	] = useState( false );

	const importTypesWithTimeRecord = useMemo(
		() =>
			importTypes.map( ( importType ) => ( {
				...importType,
				onClick: () => {
					importType.onClick();
					recordCompletionTime();
				},
			} ) ),
		[ recordCompletionTime ]
	);

	const {
		loadSampleProduct,
		isLoadingSampleProducts,
	} = useLoadSampleProducts( {
		redirectUrlAfterSuccess: getAdminLink(
			'edit.php?post_type=product&wc_onboarding_active_task=products'
		),
	} );

	const productTypeListItems = useProductTypeListItems(
		getProductTypes( {
			exclude: [ 'subscription' ],
		} ),
		[],
		{
			onClick: recordCompletionTime,
		}
	);

	const StacksComponent = (
		<Stacks
			items={ productTypeListItems }
			onClickLoadSampleProduct={ () =>
				setIsConfirmingLoadSampleProducts( true )
			}
		/>
	);

	return (
		<div className="woocommerce-task-import-products">
			<h1>{ __( 'Import your products', 'woocommerce' ) }</h1>
			<CardList items={ importTypesWithTimeRecord } />
			<div className="woocommerce-task-import-products-stacks">
				<Button
					onClick={ () => {
						recordEvent(
							'tasklist_add_product_from_scratch_click'
						);
						setStackVisibility( ! showStacks );
					} }
				>
					{ __( 'Or add your products from scratch', 'woocommerce' ) }
					<Icon icon={ showStacks ? chevronUp : chevronDown } />
				</Button>
				{ showStacks && StacksComponent }
			</div>
			{ isLoadingSampleProducts ? (
				<LoadSampleProductModal />
			) : (
				isConfirmingLoadSampleProducts && (
					<LoadSampleProductConfirmModal
						onCancel={ () =>
							setIsConfirmingLoadSampleProducts( false )
						}
						onImport={ () => {
							setIsConfirmingLoadSampleProducts( false );
							loadSampleProduct();
						} }
					/>
				)
			) }
		</div>
	);
};

registerPlugin( 'wc-admin-onboarding-task-products', {
	// @ts-expect-error 'scope' does exist. @types/wordpress__plugins is outdated.
	scope: 'woocommerce-tasks',
	render: () => (
		<WooOnboardingTask id="products" variant="import">
			<Products />
		</WooOnboardingTask>
	),
} );
